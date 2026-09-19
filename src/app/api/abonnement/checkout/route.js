// Démarre un abonnement : crée (ou réutilise) le client Stripe du profil,
// ouvre une session de paiement Stripe Checkout et renvoie son URL.
// L'utilisateur est redirigé vers la page de paiement sécurisée hébergée par
// Stripe, en français, avec l'essai de 3 jours et la carte demandée dès
// l'inscription (l'essai est entièrement géré par Stripe, pas par l'appli).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigure } from "@/lib/stripe";

export const runtime = "nodejs";

function bad(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return bad("Connexion requise.", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, abonnement_statut")
    .eq("id", user.id)
    .maybeSingle();

  if (["active", "trialing"].includes(profile?.abonnement_statut)) {
    return bad("Tu as déjà un abonnement actif.", 409);
  }
  if (!stripeConfigure()) {
    return bad("Les paiements ne sont pas encore configurés. Réessaie bientôt.", 503);
  }

  const stripe = getStripe();
  const origin = process.env.APP_URL || new URL(request.url).origin;

  try {
    // 1. Un client Stripe par profil (réutilisé s'il existe déjà).
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        // Langue du client -> détermine la langue des factures (PDF + page hébergée).
        preferred_locales: ["fr"],
        metadata: { profile_id: user.id },
      });
      customerId = customer.id;
      // Écrit via service_role (le webhook, sans session, s'en sert aussi).
      await createAdminClient().from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    // 2. Session de paiement (abonnement mensuel récurrent).
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: user.id,
      allow_promotion_codes: true,
      locale: "fr",
      subscription_data: {
        // Essai de 3 jours géré par Stripe (voir décisions actées).
        trial_period_days: 3,
      },
      // La carte est demandée dès l'inscription, même pendant l'essai.
      payment_method_collection: "always",
      // Managed Payments (activé par défaut sur les nouveaux comptes Stripe)
      // ajoute 3,5 % de frais par transaction et exige un "tax code" sur le
      // produit qu'on ne veut pas gérer ici : on le désactive explicitement.
      managed_payments: { enabled: false },
      success_url: `${origin}/compte?abonnement=ok`,
      cancel_url: `${origin}/compte?abonnement=annule`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return bad("Erreur Stripe : " + (e?.message || "inconnue"), 500);
  }
}
