// Répercute l'état d'un abonnement Stripe sur le profil (par client Stripe).
// Partagé entre /api/abonnement/sync (retour de paiement, ci-dessous) et le
// futur webhook Stripe (étape 8).
// ⚠️ SERVEUR uniquement : reçoit un client service_role.
export async function syncSubscription(svc, sub) {
  const finUnix = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
  await svc
    .from("profiles")
    .update({
      abonnement_statut: sub.status, // active, trialing, past_due, canceled, unpaid…
      stripe_subscription_id: sub.id,
      abonnement_fin: finUnix ? new Date(finUnix * 1000).toISOString() : null,
    })
    .eq("stripe_customer_id", sub.customer);
}
