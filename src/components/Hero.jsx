"use client";
import { useEffect, useState } from "react";

// Coup d'envoi du match d'ouverture du Mondial 2026 (Mexique – Afrique du Sud, Estadio Azteca).
const KICKOFF = new Date("2026-06-11T19:00:00Z").getTime();

function computeParts(now) {
  const diff = KICKOFF - now;
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function Cell({ n, l }) {
  return (
    <div className="cd">
      <div className="n">{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

export default function Hero({ t }) {
  // Calcul différé au montage : évite un décalage entre le rendu serveur et le navigateur.
  const [parts, setParts] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setParts(computeParts(Date.now()));
    const id = setInterval(() => setParts(computeParts(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero">
      <span className="kick">
        <span className="pulse" /> {t.heroKick}
      </span>
      <h1>
        {t.heroLine} <em>{t.heroEm}</em>
      </h1>
      <p className="lead">{t.lead}</p>
      <div className="countdown">
        {!mounted ? null : parts ? (
          <>
            <Cell n={pad(parts.d)} l={t.days} />
            <Cell n={pad(parts.h)} l={t.hours} />
            <Cell n={pad(parts.m)} l={t.min} />
            <Cell n={pad(parts.s)} l={t.sec} />
          </>
        ) : (
          <div className="cd" style={{ minWidth: "auto" }}>
            <div className="n" style={{ color: "var(--hot)" }}>
              {t.liveBig}
            </div>
          </div>
        )}
      </div>
      <p className="cd-note">{mounted && !parts ? t.liveNote : t.cdNote}</p>
    </section>
  );
}
