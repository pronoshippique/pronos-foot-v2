// Cerveau des règles d'accès.
//
// Une seule question à répondre : cette personne a-t-elle accès au contenu
// payant (les analyses IA) ? Trois façons d'avoir accès :
//   1. avoir un abonnement Stripe actif (statut "active") ;
//   2. être dans les 3 jours suivant l'inscription (essai gratuit MAISON,
//      sans carte bancaire — calculé ici à partir de `created_at`, PAS géré
//      par Stripe) ;
//   3. pendant la PÉRIODE DE LANCEMENT GRATUITE (interrupteur global) :
//      tout le monde a accès, le temps des tests.
//
// Contrairement à BTA, il n'y a ici qu'un seul type d'utilisateur : pas de
// rôle admin, pas de statut "fondateur" gratuit à vie.

const JOUR_MS = 24 * 60 * 60 * 1000;
const DUREE_ESSAI_MS = 3 * JOUR_MS;

// Statuts Stripe considérés comme « accès ouvert ». "trialing" reste listé
// par sécurité (essai créé manuellement depuis le dashboard Stripe), mais le
// checkout de l'appli ne le déclenche plus lui-même : voir l'essai maison.
const STATUTS_ACTIFS = ["active", "trialing"];

// La période de lancement gratuite est-elle en cours ?
// Par défaut OUI, sauf si LANCEMENT_GRATUIT="false" dans l'environnement.
export function lancementGratuit() {
  return process.env.LANCEMENT_GRATUIT !== "false";
}

// Le profil a-t-il un abonnement Stripe qui ouvre l'accès ?
export function abonnementActif(profile) {
  return STATUTS_ACTIFS.includes(profile?.abonnement_statut);
}

// Date de fin de l'essai gratuit maison (3 jours après l'inscription), ou
// null si on ne connaît pas la date d'inscription.
export function finEssai(profile) {
  if (!profile?.created_at) return null;
  return new Date(new Date(profile.created_at).getTime() + DUREE_ESSAI_MS);
}

// L'essai gratuit maison (sans carte) est-il toujours en cours ?
export function essaiActif(profile) {
  const fin = finEssai(profile);
  return Boolean(fin && Date.now() < fin.getTime());
}

// Nombre de jours restants avant la fin de l'essai (arrondi au jour
// supérieur, jamais négatif) — pour l'affichage dans "Mon compte".
export function joursRestantsEssai(profile) {
  const fin = finEssai(profile);
  if (!fin) return 0;
  return Math.max(0, Math.ceil((fin.getTime() - Date.now()) / JOUR_MS));
}

// Décision finale d'accès : la seule fonction à appeler depuis le reste du
// code pour savoir si une personne peut voir le contenu payant.
export function aAcces(profile) {
  return Boolean(lancementGratuit() || abonnementActif(profile) || essaiActif(profile));
}

// Libellé lisible du statut d'abonnement, pour l'affichage dans "Mon compte".
export function libelleStatut(profile) {
  switch (profile?.abonnement_statut) {
    case "active":
      return "Abonnement actif";
    case "trialing":
      return "Période d'essai";
    case "past_due":
      return "Paiement en retard";
    case "unpaid":
      return "Impayé";
    case "canceled":
      return "Abonnement résilié";
    default:
      if (essaiActif(profile)) {
        const jours = joursRestantsEssai(profile);
        return `Essai gratuit — encore ${jours} jour${jours > 1 ? "s" : ""}`;
      }
      return "Pas d'abonnement";
  }
}
