// Bloc d'accroche de la page d'accueil. Le compte à rebours du Mondial 2026
// a été retiré (le tournoi est terminé) : recentrage sur les grands
// championnats européens en cours. Composant purement présentationnel,
// plus besoin de "use client" (aucun état, aucun minuteur).
export default function Hero({ t }) {
  return (
    <section className="hero">
      <span className="kick">
        <span className="pulse" /> {t.heroKick}
      </span>
      <h1>
        {t.heroLine} <em>{t.heroEm}</em>
      </h1>
      <p className="lead">{t.lead}</p>
      <p className="hero-highlight">⚡ {t.highlight}</p>
    </section>
  );
}
