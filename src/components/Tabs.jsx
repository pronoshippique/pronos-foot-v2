"use client";

// Mondial 2026 terminé : le site se recentre sur les championnats en cours.
// L'onglet Coupe du Monde est gardé (au cas où), mais relégué en dernier.
export const COMPETITIONS = [
  { id: "today", labelKey: "tabToday" },
  { id: "l1", label: "Ligue 1" },
  { id: "pl", label: "Premier League" },
  { id: "liga", label: "La Liga" },
  { id: "seriea", label: "Serie A" },
  { id: "bundes", label: "Bundesliga" },
  { id: "wc", labelKey: "tabWc" },
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
