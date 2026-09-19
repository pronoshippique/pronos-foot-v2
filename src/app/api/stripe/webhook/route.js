// Webhook Stripe : Stripe appelle cette URL pour nous prévenir des événements
// de paiement (abonnement créé, renouvelé, résilié, paiement échoué…). On met
// alors à jour l'état d'abonnement du profil concerné.
//
// Sécurité : chaque appel est SIGNÉ par Stripe. On vérifie la signature avec
// STRIPE_WEBHOOK_SECRET sur le corps BRUT de la requête (d'où request.text()).
// Un appel non signé / falsifié est rejeté.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { syncSubscription } from "@/lib/stripe-sync";

export const runtime = "nodejs";

export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });
  }

  const body = await request.text(); // corps BRUT, indispensable pour la signature
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    // Signature invalide -> on refuse (400) : Stripe réessaiera si besoin.
    return NextResponse.json({ error: "Signature invalide : " + e.message }, { status: 400 });
  }

  const svc = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription);
          await syncSubscription(svc, sub);
        }
        break;
      }
      // Créé, renouvelé, passé en retard de paiement (past_due/unpaid), ou
      // résilié : tous ces cas se traduisent par un customer.subscription.*
      // avec le nouveau statut dans sub.status — syncSubscription copie ce
      // statut tel quel sur le profil.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(svc, event.data.object);
        break;
      }
      default:
        // Autres événements ignorés (on répond quand même 200 à Stripe).
        break;
    }
  } catch (e) {
    // On loggue mais on renvoie 500 pour que Stripe réessaie l'événement.
    console.error("Webhook Stripe — échec de traitement :", e?.message);
    return NextResponse.json({ error: "Traitement échoué." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
