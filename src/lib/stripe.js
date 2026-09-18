// Client Stripe côté SERVEUR uniquement.
// ⚠️ Ne jamais importer ce fichier dans un composant client : il utilise la
// clé secrète (sk_test_… en mode test). Elle vit dans .env.local, jamais sur GitHub.
import Stripe from "stripe";

let _stripe = null;

// Instancie (paresseusement) le client Stripe. Lève une erreur claire si la
// clé n'est pas configurée, plutôt qu'un plantage obscur plus loin.
export function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY manquante dans .env.local (clé secrète de test sk_test_…)."
    );
  }
  _stripe = new Stripe(key);
  return _stripe;
}

// Vrai tant que les clés Stripe ne sont pas encore renseignées : permet à
// l'interface d'afficher un état « paiement pas encore configuré » sans planter.
export function stripeConfigure() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
