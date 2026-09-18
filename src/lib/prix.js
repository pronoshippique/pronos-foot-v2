// Prix de l'abonnement Pronos Foot — un seul endroit à changer si le prix
// évolue un jour. 14,90 € TTC tout compris, un seul plan (voir
// FEUILLE-DE-ROUTE.md, décisions actées).
export const PRIX = {
  montantTTC: 14.9, // euros TTC, montant réellement facturé
  devise: "EUR",
  periode: "mois",
};

// En centimes, pour Stripe (1490 = 14,90 €) — utilisé à l'étape 6.
export function montantCentimes() {
  return Math.round(PRIX.montantTTC * 100);
}

// Format monétaire français : 14,90 €
export function euro(montant = PRIX.montantTTC) {
  return montant.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// Libellé de prix principal à afficher (ex. dans la future modale d'abonnement).
export function prixPrincipal() {
  return `${euro()}/${PRIX.periode}`;
}
