"use client";

// Mondial 2026 terminé, prochain en 2030 : l'onglet Coupe du Monde est
// retiré tant qu'aucune Coupe du Monde n'est en cours (il affichait sinon
// les matchs de juin 2026, déjà joués). Le site se recentre sur les
// championnats en cours. La route /api/matches?comp=wc existe toujours
// côté serveur, prête à être réactivée le jour venu.
export const COMPETITIONS = [
  { id: "today", labelKey: "tabToday" },
  { id: "l1", label: "Ligue 1" },
  { id: "pl", label: "Premier League" },
  { id: "liga", label: "La Liga" },
  { id: "seriea", label: "Serie A" },
  { id: "bundes", label: "Bundesliga" },
];

export default function Tabs({ active, onChange, t }) {
  return (
    <div className="tabs">
      {COMPETITIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`tab${active === c.id ? " active" : ""}`}
          onClick={() => onChange(c.id)}
        >
          {c.labelKey ? t[c.labelKey] : c.label}
        </button>
      ))}
    </div>
  );
}
