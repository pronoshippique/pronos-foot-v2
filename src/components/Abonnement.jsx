"use client";
// Carte "Abonnement" de l'espace compte (étape 7).
// Affiche le prix, l'état de l'abonnement, et le bouton "S'abonner".
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { prixPrincipal } from "@/lib/prix";
import { libelleStatut } from "@/lib/abonnement";

export default function Abonnement({ profile, paiementActif, lancementGratuit, flash }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const abonne = ["active", "trialing"].includes(profile?.abonnement_statut);

  // Au retour du paiement (?abonnement=ok), on demande à Stripe l'état réel
  // de l'abonnement et on rafraîchit — filet de sécurité en plus du webhook
  // (pas encore branché à cette étape).
  useEffect(() => {
    if (flash !== "ok" || abonne) return;
    let annule = false;
    (async () => {
      try {
        await fetch("/api/abonnement/sync", { method: "POST" });
        if (!annule) router.refresh();
      } catch {
        // le webhook (étape 8) prendra le relais
      }
    })();
    return () => {
      annule = true;
    };
  }, [flash, abonne, router]);

  async function handleSubscribe() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/abonnement/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur.");
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="account-card">
      <div className="account-card-title">Abonnement</div>
      <div className="account-status" data-active={abonne}>
        {libelleStatut(profile)}
      </div>
      <div className="account-price">{prixPrincipal()}</div>

      {flash === "ok" && !abonne && (
        <div className="form-success">
          Paiement enregistré. Ton abonnement sera actif dans un instant.
        </div>
      )}
      {flash === "annule" && (
        <div className="form-error">Paiement annulé — tu peux réessayer quand tu veux.</div>
      )}
      {lancementGratuit && !abonne && (
        <div className="form-success">
          Période de lancement : l&apos;accès est <b>gratuit pour l&apos;instant</b>. L&apos;abonnement
          deviendra nécessaire plus tard — tu peux déjà t&apos;abonner pour soutenir le service.
        </div>
      )}
      {error && <div className="form-error">{error}</div>}

      {abonne ? (
        <p className="account-note">
          La gestion de l&apos;abonnement (facture, résiliation) arrivera bientôt sur cette page.
        </p>
      ) : (
        <>
          <button
            className="btn-primary"
            type="button"
            onClick={handleSubscribe}
            disabled={busy || !paiementActif}
          >
            {busy ? "Redirection…" : "S'abonner"}
          </button>
          {!paiementActif && (
            <p className="account-note">Les paiements sont en cours de configuration.</p>
          )}
        </>
      )}
    </div>
  );
}
