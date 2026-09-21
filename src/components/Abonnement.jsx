"use client";
// Carte "Abonnement" de l'espace compte (étapes 7 et 9).
// Affiche le prix, l'état de l'abonnement, et selon le cas :
//  - "S'abonner" (Stripe Checkout) si pas encore abonné,
//  - "Gérer mon abonnement" (Stripe Billing Portal) si abonné ou en essai.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { prixPrincipal } from "@/lib/prix";
import { libelleStatut, essaiActif, finEssai, joursRestantsEssai } from "@/lib/abonnement";

export default function Abonnement({ profile, paiementActif, lancementGratuit, flash }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const abonne = ["active", "trialing"].includes(profile?.abonnement_statut);
  const enEssai = essaiActif(profile);
  const dateFinEssai = finEssai(profile);
  const joursEssai = joursRestantsEssai(profile);

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

  async function handleManage() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/abonnement/portal", { method: "POST" });
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
      {!lancementGratuit && !abonne && enEssai && (
        <div className="form-success">
          Essai gratuit en cours : encore {joursEssai} jour{joursEssai > 1 ? "s" : ""}, jusqu&apos;au{" "}
          {dateFinEssai?.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}.
          Aucune carte bancaire n&apos;est demandée pour l&apos;instant — tu peux t&apos;abonner dès
          maintenant si tu préfères payer par avance.
        </div>
      )}
      {!lancementGratuit && !abonne && !enEssai && (
        <div className="form-error">
          Ton essai gratuit est terminé. Abonne-toi pour continuer à profiter des analyses IA.
        </div>
      )}
      {error && <div className="form-error">{error}</div>}

      {abonne ? (
        <>
          <button className="btn-primary" type="button" onClick={handleManage} disabled={busy}>
            {busy ? "Ouverture…" : "Gérer mon abonnement"}
          </button>
          <p className="account-note">
            Factures, moyen de paiement, résiliation : tout se gère depuis l&apos;espace Stripe qui
            s&apos;ouvre en cliquant ci-dessus.
          </p>
        </>
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
