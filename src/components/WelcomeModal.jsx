"use client";
import { useEffect } from "react";
import Link from "next/link";
import { prixPrincipal } from "@/lib/prix";

// Écran de bienvenue affiché aux visiteurs non connectés, une seule fois
// (mémorisé dans localStorage par l'appelant — voir PronosApp.jsx). Objectif :
// réduire le taux de rebond en montrant tout de suite la gratuité de l'essai.
export default function WelcomeModal({ t, onClose }) {
  // Ferme sur Échap, et empêche le scroll de la page derrière la modale.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="welcome-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <button className="welcome-close" type="button" onClick={onClose} aria-label={t.welcomeClose}>
          ×
        </button>

        <h2 id="welcome-title" className="welcome-title">
          {t.welcomeTitle}
        </h2>
        <p className="welcome-subtitle">{t.welcomeSubtitle}</p>

        <div className="welcome-highlight">{t.welcomeHighlight}</div>

        <p className="welcome-text">
          {t.welcomeIntro} {t.welcomeAfterTrial} {prixPrincipal()} {t.welcomeCancelNote}
        </p>

        <p className="welcome-install">{t.welcomeInstall}</p>

        <Link className="cta welcome-cta" href="/inscription" onClick={onClose}>
          {t.freeBtn}
        </Link>
      </div>
    </div>
  );
}
