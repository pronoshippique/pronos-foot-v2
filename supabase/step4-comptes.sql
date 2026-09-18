-- ============================================================
-- Pronos Foot — Étape 4 : pseudo à l'inscription
--
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query,
-- coller ce fichier en entier, puis "Run".
-- Idempotent : on peut le relancer sans casser l'existant.
-- ============================================================

-- Ajoute la colonne pseudo au profil (absente du schéma de l'étape 2).
alter table public.profiles
  add column if not exists pseudo text;

-- Met à jour le déclencheur de création automatique du profil (étape 2)
-- pour qu'il récupère le pseudo saisi à l'inscription. Le pseudo est transmis
-- par le code via `options.data.pseudo` de supabase.auth.signUp(), Supabase le
-- range dans raw_user_meta_data, accessible ici.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, new.raw_user_meta_data->>'pseudo');
  return new;
end;
$$;
