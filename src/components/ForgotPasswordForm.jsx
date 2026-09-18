"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm({ expired = false }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Renseigne un e-mail valide.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    // Où Supabase renvoie l'utilisateur après avoir cliqué sur le lien du mail.
    const redirectTo = `${window.location.origin}/auth/callback?next=/nouveau-mot-de-passe`;
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    // Par sécurité on n'indique JAMAIS si l'e-mail existe : même message dans tous les cas.
    if (resetErr) {
      setError("Envoi impossible pour le moment. Réessaie dans un instant.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="wrap auth-main">
      <div className="auth-card">
        {sent ? (
          <>
            <h1 className="auth-title">E-mail envoyé</h1>
            <div className="form-success">
              Si un compte est associé à <b>{email.trim().toLowerCase()}</b>, tu vas recevoir un
              lien pour choisir un nouveau mot de passe. Pense à vérifier tes courriers indésirables.
            </div>
            <div className="auth-links">
              <Link href="/connexion">Retour à la connexion</Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="auth-title">Mot de passe oublié</h1>
            <p className="auth-subtitle">
              Indique ton e-mail, on t&apos;envoie un lien pour en choisir un nouveau.
            </p>

            {expired && (
              <div className="form-error">
                Ce lien a expiré ou a déjà été utilisé. Redemande-en un ci-dessous.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="moi@exemple.fr"
                  autoComplete="email"
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Envoi en cours…" : "Recevoir le lien"}
              </button>
            </form>

            <div className="auth-links">
              <Link href="/connexion">Retour à la connexion</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
