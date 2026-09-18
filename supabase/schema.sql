-- ============================================================
-- Pronos Foot — Schéma de base + sécurité RLS (Étape 2 — Supabase + base)
--
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query,
-- coller ce fichier en entier, puis "Run".
-- Ce script est idempotent : on peut le relancer sans casser l'existant.
--
-- Contexte du projet (voir FEUILLE-DE-ROUTE.md) :
--   - un seul type d'utilisateur, pas de rôle admin en base ;
--   - pas de validation manuelle : le profil est créé automatiquement
--     dès qu'un compte est créé ;
--   - l'essai gratuit de 3 jours est géré par Stripe lui-même
--     (statut "trialing"), on ne calcule aucune date d'essai ici ;
--   - tout est payant : aucune colonne "gratuit à vie" façon BTA.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";  -- pour gen_random_uuid()

-- ============================================================
-- 1. TABLES
-- ============================================================

-- ---- profiles : un profil par compte, créé automatiquement (voir section 2) ----
create table if not exists public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  langue_preferee        text not null default 'fr'
                           check (langue_preferee in ('fr', 'en', 'es', 'pt', 'ar', 'de', 'it')),
  -- Abonnement Stripe : ces colonnes ne sont modifiables que par le serveur
  -- (webhook Stripe via service_role) — voir le garde-fou en section 3.
  stripe_customer_id     text,
  stripe_subscription_id text,
  -- Reprend tel quel le statut Stripe (aucun, trialing, active, past_due,
  -- canceled, unpaid…) : PAS de CHECK pour ne rien casser si Stripe ajoute
  -- une valeur un jour.
  abonnement_statut      text not null default 'aucun',
  abonnement_fin         timestamptz,
  created_at             timestamptz not null default now()
);

-- Un client Stripe = un profil au maximum.
create unique index if not exists idx_profiles_stripe_customer
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- ---- analyses_cache : mémorise une analyse IA déjà générée (match + langue) ----
-- Évite de repayer Claude à chaque clic sur "Analyse IA" pour le même match.
-- Lue et écrite uniquement par le serveur (route /api/pronos, via
-- service_role) : aucune policy côté client, voir section 4.
create table if not exists public.analyses_cache (
  id         uuid primary key default gen_random_uuid(),
  match_id   text not null,   -- identifiant du match (fixture.id API-Football)
  langue     text not null,
  contenu    text not null,   -- le texte de l'analyse généré par Claude
  created_at timestamptz not null default now(),
  unique (match_id, langue)
);

create index if not exists idx_analyses_cache_match on public.analyses_cache (match_id);

-- ============================================================
-- 2. CRÉATION AUTOMATIQUE DU PROFIL À L'INSCRIPTION
--    Dès qu'un compte Supabase Auth est créé, un profil est créé avec lui,
--    tout de suite actif (pas de statut "en attente", pas de validation
--    admin manuelle — inscription grand public automatique).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. GARDE-FOU : empêcher un utilisateur de s'auto-attribuer un abonnement
--    Un utilisateur peut modifier son propre profil (ex. sa langue), MAIS
--    il ne peut pas changer lui-même ses colonnes d'abonnement Stripe.
--    Seul le serveur (webhook Stripe, connecté avec la clé service_role)
--    peut le faire. Sans ce garde-fou, n'importe qui pourrait s'attribuer
--    un abonnement "actif" gratuitement via une simple requête UPDATE.
--
--    auth.role() renvoie le rôle porté par la connexion : 'authenticated'
--    pour un utilisateur normal, 'service_role' pour le serveur (webhook).
-- ============================================================
create or replace function public.prevent_abonnement_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;  -- le serveur (webhook Stripe) a tous les droits
  end if;

  if new.stripe_customer_id      is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.abonnement_statut      is distinct from old.abonnement_statut
     or new.abonnement_fin         is distinct from old.abonnement_fin then
    raise exception
      'Modification non autorisée : l''abonnement est géré uniquement par le serveur.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_abonnement_escalation on public.profiles;
create trigger trg_prevent_abonnement_escalation
  before update on public.profiles
  for each row execute function public.prevent_abonnement_escalation();

-- ============================================================
-- 4. ROW LEVEL SECURITY
--    On active RLS partout : sans policy, l'accès est REFUSÉ par défaut.
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.analyses_cache enable row level security;

-- ---------- PROFILES ----------
-- Lecture : uniquement son propre profil (un seul type d'utilisateur,
-- personne n'a besoin de voir le profil de quelqu'un d'autre).
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid());

-- Mise à jour : uniquement son propre profil (le garde-fou de la section 3
-- bloque la modification des colonnes d'abonnement).
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Pas de policy d'insertion ni de suppression : le profil est créé
-- automatiquement par le déclencheur (section 2) et supprimé automatiquement
-- si le compte auth.users est supprimé (on delete cascade).

-- ---------- ANALYSES_CACHE ----------
-- RLS activée SANS aucune policy => personne ne lit/écrit côté client.
-- Seule la route serveur /api/pronos (connectée en service_role) y accède.
