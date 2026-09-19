# Pronos Foot — Feuille de route de reconstruction

> Reconstruction complète en Next.js + Supabase + Stripe, sur le patron du projet **BTA**.
> On construit par étapes : chaque étape doit fonctionner avant de passer à la suivante.

---

## 0. Décisions déjà actées

- Essai gratuit de **3 jours**, carte bancaire demandée dès l'inscription, essai géré **par Stripe** (pas de calcul de date côté appli)
- Confirmation d'e-mail activée à l'inscription
- Prix : **14,90 € TTC** tout compris, un seul plan
- Inscription grand public **automatique**, aucune validation admin manuelle
- Accès : **tout est payant**, aucune analyse gratuite (l'essai de 3 jours sert de découverte)
- Interrupteur **`LANCEMENT_GRATUIT`** pour ouvrir l'accès pendant les tests (comme BTA)
- Modèle IA pour les analyses : **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`)
- À conserver de l'ancienne version HTML : le design (vert sombre `#0a0f0c` / lime `#c5ff3a`, polices Anton + Archivo), les **7 langues** (fr / en / es / pt / ar / de / it, RTL pour l'arabe), le compte à rebours Mondial 2026, et les textes existants
- Structure de dossiers et habitudes de code : calquées sur **BTA** (`src/app`, `src/components`, `src/lib/supabase/{client,server,admin}.js`, RLS partout, garde-fou anti-escalade de profil)

---

## Étape 1 — Squelette Next.js

Créer le projet (App Router + Tailwind), reprendre le design et les textes de l'ancienne version HTML, sans aucun backend pour l'instant.

- `create-next-app`, structure de dossiers façon BTA (`src/app`, `src/components`, `src/lib`)
- Charte graphique reprise de `index.html` : variables CSS (`--bg`, `--lime`, `--hot`…), polices Google Fonts Anton + Archivo (+ Noto Sans Arabic pour le RTL)
- Page d'accueil statique : en-tête, hero, compte à rebours Mondial 2026, onglets par compétition, grille de cartes de matchs (données factices pour l'instant)
- Système i18n : reprendre le dictionnaire `TR{}` (7 langues), sélecteur de langue, `dir="rtl"` automatique pour l'arabe
- Porter `api/matches.js` (flux API-Football) en route Next.js — fonctionnel mais pas encore lié à un compte
- Porter `api/pronos.js` (analyse IA Claude Haiku 4.5) en route Next.js — fonctionnelle mais **non protégée** pour l'instant (le verrouillage vient plus tard)

→ **Vérifier** : `npm run dev` tourne, le design + le compte à rebours + le changement de langue + l'affichage des matchs + un bouton « Analyse IA » qui répond fonctionnent, sans base de données ni compte utilisateur.

---

## Étape 2 — Supabase + base ✅ Terminée

Créer le projet Supabase (région Europe) et le schéma de données.

- Table `profiles` (liée à `auth.users`) : `langue_preferee`, `stripe_customer_id`, `stripe_subscription_id`, `abonnement_statut` (défaut `'aucun'`, reprend tel quel les statuts Stripe), `abonnement_fin`
- Table `analyses_cache` (optionnel mais recommandé) : mémorise une analyse déjà générée par match + langue, pour ne pas repayer Claude à chaque clic (remplace le cache mémoire volatile de l'ancien `api/pronos.js`)
- RLS activée sur toutes les tables dès le départ (chacun lit/modifie son propre profil ; personne ne lit le profil d'un autre)
- Garde-fou anti-escalade : un utilisateur ne peut pas modifier lui-même `abonnement_statut`, `stripe_customer_id`, etc. (réservé au webhook via `service_role`)

→ **Vérifier** : les tables existent dans Supabase, RLS est active, on peut insérer/lire une ligne de test depuis le SQL Editor.

---

## Étape 3 — Branchement Supabase ✅ Terminée

Connecter le projet Next.js à Supabase.

- Variables d'environnement (`.env.local`, jamais commité) : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `src/lib/supabase/client.js` (navigateur), `server.js` (composants serveur / routes, session cookie), `admin.js` (`service_role`, uniquement côté serveur pour le webhook)

→ **Vérifier** : une page du site affiche une donnée lue depuis Supabase (ex. nombre de profils), sans erreur de connexion.

---

## Étape 4 — Inscription / connexion / mot de passe oublié ✅ Terminée

- Pages : inscription, connexion, mot-de-passe-oublié, nouveau-mot-de-passe (façon BTA)
- Confirmation d'e-mail activée dans Supabase Auth + route `/auth/callback`
- Création automatique du `profile` à l'inscription (id = auth.users.id)
- Écran « vérifie ta boîte mail » entre l'inscription et la première connexion
- Pas de statut « en attente de validation admin » : dès l'e-mail confirmé, le compte est actif (inscription grand public automatique)

→ **Vérifier** : on crée un compte, on reçoit l'e-mail de confirmation, on peut se connecter, se déconnecter, et réinitialiser son mot de passe.

---

## Étape 5 — Cerveau des règles d'accès ✅ Terminée

`src/lib/acces.js`, sur le modèle de `lib/abonnement.js` de BTA, mais simplifié : ici **pas d'exception** fondateur/établissement, tout le monde suit la même règle.

- `lancementGratuit()` : lit l'interrupteur `LANCEMENT_GRATUIT` (env var), `true` par défaut pendant les tests
- `abonnementActif(profile)` : `abonnement_statut` dans `["active", "trialing"]` (le statut `trialing` vient de Stripe — pas de calcul de date maison, contrairement à BTA)
- `aAccesPaye(profile)` = `lancementGratuit() || abonnementActif(profile)`
- Toutes les routes d'analyse IA et d'affichage détaillé passent par cette fonction avant de répondre

→ **Vérifier** : en basculant `LANCEMENT_GRATUIT` entre `true` et `false` dans `.env.local`, un compte sans abonnement voit l'accès s'ouvrir/se fermer en conséquence (redémarrage du serveur dev entre les deux tests).

---

## Étape 6 — Stripe produit + prix ✅ Terminée

- Créer le produit « Pronos Foot » et son prix récurrent mensuel **14,90 € TTC** dans le dashboard Stripe (mode test)
- Script `scripts/setup-stripe.mjs` (façon BTA) pour créer/retrouver le produit et le prix automatiquement
- Variables d'env : `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` (rempli à l'étape 8)

→ **Vérifier** : le produit et le prix apparaissent dans le dashboard Stripe (mode test), `STRIPE_PRICE_ID` est renseigné dans `.env.local`.

---

## Étape 7 — Paiement ✅ Terminée

- Route `/api/abonnement/checkout` (façon BTA) : crée/réutilise le client Stripe du profil, ouvre une session Checkout `mode: "subscription"`
- Point important vs BTA : `trial_period_days: 3` **et** `payment_method_collection: "always"` — la carte est demandée dès l'inscription, l'essai est géré par Stripe lui-même (pas par l'appli)
- Bouton « S'abonner » relié à cette route sur le site (modal reprise du design de l'ancienne version)

→ **Vérifier** : on peut aller jusqu'à la page de paiement Stripe test, entrer une carte de test, revenir sur le site avec un statut d'abonnement `trialing`.

---

## Étape 8 — Webhook ✅ Terminée

- Route `/api/stripe/webhook` (façon BTA) : vérifie la signature Stripe sur le corps brut, écoute `checkout.session.completed`, `customer.subscription.created/updated/deleted`
- `src/lib/stripe-sync.js` : répercute `abonnement_statut`, `stripe_subscription_id`, `abonnement_fin` sur le profil via `service_role`

→ **Vérifier** : avec `stripe listen --forward-to localhost:3000/api/stripe/webhook`, déclencher un événement de test et voir le profil se mettre à jour en base.

---

## Étape 9 — Résiliation via portail Stripe ✅ Terminée

- Route `/api/abonnement/portal` (façon BTA) : ouvre une session du Billing Portal Stripe pour le client du profil
- Bouton « Gérer mon abonnement » dans la page « Mon compte » (facture, carte, résiliation en libre-service)

→ **Vérifier** : on accède au portail Stripe, on peut résilier ; le webhook (étape 8) remet `abonnement_statut` à `canceled`.

---

## Étape 10 — Fermeture de l'accès ✅ Terminée (verrou serveur + interface de verrouillage visuelle)

- Basculer `LANCEMENT_GRATUIT=false` : seules les analyses des comptes en essai (`trialing`) ou abonnés (`active`) restent accessibles
- Interface de verrouillage sur les cartes de match (reprise du bloc `.lock` de l'ancienne version) : message + bouton « Débloquer · 14,90 €/mois »
- Vérifier que la route d'analyse IA elle-même refuse la génération côté serveur (pas seulement côté affichage) pour un compte non éligible

→ **Vérifier** : un compte sans essai ni abonnement voit le verrou et ne peut pas déclencher d'analyse IA (même en appelant la route directement) ; un compte `trialing` ou `active` y a accès normalement.

---

## Étape 11 — Mise en ligne Vercel

- Déploiement du projet sur Vercel, variables d'environnement de production renseignées (Supabase + Stripe **toujours en mode test** à ce stade)
- Domaine branché, `APP_URL` mis à jour pour les redirections Stripe

→ **Vérifier** : le site est accessible en ligne à son domaine définitif, et tout ce qui a été validé aux étapes précédentes (inscription, paiement test, verrouillage) fonctionne en production.

---

## Étape 12 — Passage en mode réel

- Remplacer les clés Stripe test par les clés **live**, recréer le produit/prix en live (ou utiliser le mode live de Stripe), reconfigurer le webhook live avec sa propre `STRIPE_WEBHOOK_SECRET`
- `LANCEMENT_GRATUIT=false` de façon définitive
- Vérification finale : mentions légales, avertissement jeu responsable (ANJ), CGV/CGU à jour avec l'essai de 3 jours et le prix 14,90 € TTC
- Test d'un vrai abonnement avec une carte réelle, puis résiliation réelle via le portail, pour confirmer que tout le circuit fonctionne en conditions réelles

→ **Vérifier** : un vrai paiement peut être souscrit et résilié en conditions réelles, sans intervention manuelle en base.

---

## Rappels transverses

- Ne jamais commiter `.env.local` sur GitHub
- Hébergement des données en **Union européenne** (région Supabase = Europe)
- La clé `service_role` ne doit **jamais** apparaître côté client
- Mobile d'abord (comme l'ancienne version, déjà pensée mobile)
- Chaque étape doit être vérifiée avant de passer à la suivante — ne pas paralléliser les étapes
