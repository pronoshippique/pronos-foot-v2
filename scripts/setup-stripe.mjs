// ============================================================
// Crée (en mode TEST) le produit + le prix récurrent de l'abonnement
// Pronos Foot.
//
// Lancer depuis la racine du projet :  npm run setup-stripe
//
// Prérequis dans .env.local :
//   STRIPE_SECRET_KEY   (clé secrète de test : sk_test_…)
//
// Le montant vient de src/lib/prix.js (14,90 €/mois). À la fin, le script
// affiche l'identifiant du prix (price_…) : copie-le dans .env.local
//   STRIPE_PRICE_ID=price_xxx
//
// Note sur l'essai de 3 jours : il n'est PAS réglé ici. Un prix Stripe n'a
// pas d'essai "actif" par lui-même — le champ recurring.trial_period_days
// n'est qu'une valeur par défaut, sans effet tant qu'on ne la réclame pas
// explicitement (trial_from_plan) à la création de l'abonnement. L'essai
// sera donc réglé directement à l'étape 7, dans la session Stripe Checkout
// (trial_period_days: 3 + payment_method_collection: "always", pour que la
// carte soit demandée dès l'inscription).
//
// Idempotent : réutilise le produit/prix existant (repéré par lookup_key).
// ============================================================
import nextEnv from "@next/env";
import Stripe from "stripe";
import { montantCentimes, PRIX, prixPrincipal } from "../src/lib/prix.js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const key = process.env.STRIPE_SECRET_KEY;

function fail(msg) {
  console.error("\n❌ " + msg + "\n");
  process.exit(1);
}
if (!key) fail("STRIPE_SECRET_KEY manquante dans .env.local (clé de test sk_test_…)");
if (!key.startsWith("sk_test_")) {
  console.warn("⚠️  La clé ne commence pas par sk_test_ : es-tu sûr d'être en mode TEST ?");
}

const stripe = new Stripe(key);
const LOOKUP = "pronos_foot_abo_mensuel";
const centimes = montantCentimes();

async function main() {
  console.log(`→ Stripe (mode ${key.startsWith("sk_test_") ? "TEST" : "?"})`);
  console.log(`  Prix cible : ${prixPrincipal()} = ${centimes} centimes ${PRIX.devise}`);

  // 1. Le prix existe-t-il déjà (même lookup_key + même montant) ?
  const found = await stripe.prices.list({
    lookup_keys: [LOOKUP],
    active: true,
    expand: ["data.product"],
    limit: 1,
  });
  const existing = found.data[0];
  if (existing && existing.unit_amount === centimes && existing.recurring?.interval === "month") {
    console.log("\nℹ️  Prix déjà en place, on le réutilise.");
    printResult(existing.id);
    return;
  }

  // 2. Produit (réutilisé s'il existe, repéré par metadata).
  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find((p) => p.metadata?.pronos_foot_plan === "mensuel");
  if (!product) {
    product = await stripe.products.create({
      name: "Pronos Foot — Abonnement mensuel",
      description: "Accès aux analyses IA d'avant-match Pronos Foot.",
      metadata: { pronos_foot_plan: "mensuel" },
    });
    console.log("✅ Produit créé :", product.id);
  } else {
    console.log("ℹ️  Produit existant :", product.id);
  }

  // 3. Prix récurrent mensuel.
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: centimes,
    currency: PRIX.devise.toLowerCase(),
    recurring: { interval: "month" },
    lookup_key: LOOKUP,
    transfer_lookup_key: true,
    metadata: { pronos_foot_plan: "mensuel" },
  });
  console.log("✅ Prix créé :", price.id);
  printResult(price.id);
}

function printResult(priceId) {
  console.log("\n──────────────────────────────────────────────");
  console.log("  À copier dans .env.local :");
  console.log("  STRIPE_PRICE_ID=" + priceId);
  console.log("──────────────────────────────────────────────\n");
}

main().catch((e) => fail(e.message || String(e)));
