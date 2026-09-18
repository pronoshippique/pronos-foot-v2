// Cerveau des règles d'accès (étape 5).
//
// Une seule question à répondre : cette personne a-t-elle accès au contenu
// payant (les analyses IA) ? Deux façons d'avoir accès :
//   1. avoir un abonnement Stripe actif ou en période d'essai ;
//   2. pendant la PÉRIODE DE LANCEMENT GRATUITE (interrupteur global) :
//      tout le monde a accès, le temps des tests.
//
// Contrairement à BTA, il n'y a ici qu'un seul type d'utilisateur : pas de
// rôle admin, pas de statut "fondateur" gratuit à vie. L'essai de 3 jours
// n'est pas calculé ici : c'est Stripe qui le gère lui-même (statut
// "trialing" du côté de son API) — voir étape 7.
//
// ⚠️ Étape 5 : cette fonction n'est encore appelée nulle part. Le blocage
// réel des pages/routes arrive à l'étape 10, une fois Stripe branché.

// Statuts Stripe considérés comme « accès ouvert ».
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

// Décision finale d'accès : la seule fonction à appeler depuis le reste du
// code pour savoir si une personne peut voir le contenu payant.
export function aAcces(profile) {
  return Boolean(lancementGratuit() || abonnementActif(profile));
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
      return "Pas d'abonnement";
  }
}
