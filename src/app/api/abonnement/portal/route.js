// Ouvre l'espace de gestion Stripe ("billing portal") : l'utilisateur peut y
// voir ses factures, changer de carte ou résilier son abonnement lui-même.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!stripeConfigure()) return bad("Paiements non configurés.", 503);
  if (!profile?.stripe_customer_id) return bad("Aucun abonnement à gérer.", 400);

  const origin = process.env.APP_URL || new URL(request.url).origin;

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/compte`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return bad("Erreur Stripe : " + (e?.message || "inconnue"), 500);
  }
}
