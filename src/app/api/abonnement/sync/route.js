// Synchronisation "tirée" de l'abonnement : au retour de la page de paiement,
// l'app demande elle-même à Stripe l'état de l'abonnement et met à jour le
// profil. Sert de filet de sécurité tant que le webhook (étape 8) n'existe
// pas encore — sans lui, le statut resterait "aucun" jusqu'à la prochaine
// visite. N'agit que sur le compte de l'utilisateur connecté.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigure } from "@/lib/stripe";
import { syncSubscription } from "@/lib/stripe-sync";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!stripeConfigure() || !profile?.stripe_customer_id) {
    return NextResponse.json({ ok: true, statut: "aucun" });
  }

  try {
    // Abonnement le plus récent de ce client (tous statuts confondus).
    const subs = await getStripe().subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "all",
      limit: 1,
    });
    const sub = subs.data[0];
    if (!sub) return NextResponse.json({ ok: true, statut: "aucun" });

    await syncSubscription(createAdminClient(), sub);
    return NextResponse.json({ ok: true, statut: sub.status });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Erreur Stripe." }, { status: 500 });
  }
}
