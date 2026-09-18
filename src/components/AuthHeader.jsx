// En-tête simplifié pour les pages de compte (inscription, connexion…) :
// juste le logo qui ramène à l'accueil, pas de sélecteur de langue (ces
// pages ne sont pour l'instant qu'en français).
import Link from "next/link";

export default function AuthHeader() {
  return (
    <header>
      <div className="wrap nav">
        <Link className="brand" href="/">
          <span className="dot" />
          <b>
            PRONOS<span>FOOT</span>
          </b>
        </Link>
      </div>
    </header>
  );
}
