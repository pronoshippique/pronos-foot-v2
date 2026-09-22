import Link from "next/link";

// Bloc d'accroche de la page d'accueil. Le compte à rebours du Mondial 2026
// a été retiré (le tournoi est terminé) : recentrage sur les grands
// championnats européens en cours.
//
// `showFreeBanner` : true seulement quand on est SÛR que le visiteur n'est
// pas connecté (voir PronosApp) — met en avant l'essai gratuit de 3 jours
// sans carte, pour ne pas donner l'impression qu'il faut payer tout de
// suite.
export default function Hero({ t, showFreeBanner }) {
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
      {showFreeBanner && (
        <div className="hero-trial-banner">
          <span>🎁 {t.heroTrialText}</span>
          <Link className="cta" href="/inscription">
            {t.freeBtn}
          </Link>
        </div>
      )}
    </section>
  );
}
