"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function InscriptionForm() {
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate() {
    if (!pseudo.trim()) return "Choisis un pseudo.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "L'e-mail ne semble pas valide.";
    if (password.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signUpErr } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { pseudo: pseudo.trim() },
        // Où Supabase renvoie l'utilisateur après avoir cliqué sur le lien du mail.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (signUpErr) {
      setError(
        signUpErr.message.toLowerCase().includes("already registered") ||
          signUpErr.message.toLowerCase().includes("already exists")
          ? "Un compte existe déjà avec cet e-mail."
          : "Inscription impossible. Réessaie dans un instant."
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="wrap auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Vérifie ta boîte mail</h1>
          <div className="form-success">
            Un e-mail de confirmation vient d&apos;être envoyé à <b>{email.trim().toLowerCase()}</b>.
            Clique sur le lien qu&apos;il contient pour activer ton compte — tu seras alors connecté
            automatiquement. Pense à vérifier tes courriers indésirables.
          </div>
          <div className="auth-links">
            <Link href="/connexion">Retour à la connexion</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap auth-main">
      <div className="auth-card">
        <h1 className="auth-title">Créer mon compte</h1>
        <p className="auth-subtitle">
          Inscription immédiate — confirme ton e-mail pour activer ton compte.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="pseudo">Pseudo</label>
            <input
              id="pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Ex. Julien57"
              autoComplete="nickname"
            />
          </div>
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
          <div className="field">
            <label htmlFor="password">Mot de passe (min. 8 caractères)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Création en cours…" : "Créer mon compte"}
          </button>
        </form>
        <div className="auth-links">
          Déjà un compte ? <Link href="/connexion">Se connecter</Link>
        </div>
      </div>
    </main>
  );
}
