"use client";
// Saisie du nouveau mot de passe. L'utilisateur est déjà authentifié (session
// de récupération ouverte par /auth/callback) : on met simplement à jour le
// mot de passe.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error: updErr } = await supabase.auth.updateUser({ password });
    if (updErr) {
      setError(
        "Impossible d'enregistrer le nouveau mot de passe. Le lien a peut-être expiré : redemande-en un."
      );
      setLoading(false);
      return;
    }

    // Mot de passe changé et session déjà active : direction l'accueil.
    router.push("/");
    router.refresh();
  }

  return (
    <main className="wrap auth-main">
      <div className="auth-card">
        <h1 className="auth-title">Nouveau mot de passe</h1>
        <p className="auth-subtitle">Choisis un mot de passe d&apos;au moins 8 caractères.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">Nouveau mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirme le mot de passe</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
          </button>
        </form>
      </div>
    </main>
  );
}
