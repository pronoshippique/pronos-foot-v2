"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Renseigne ton e-mail et ton mot de passe.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signInErr) {
      setError(
        signInErr.message.toLowerCase().includes("email not confirmed")
          ? "Confirme d'abord ton e-mail (regarde ta boîte de réception)."
          : "E-mail ou mot de passe incorrect."
      );
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="wrap auth-main">
      <div className="auth-card">
        <h1 className="auth-title">Se connecter</h1>
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
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <div className="auth-links">
          <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </div>
        <div className="auth-links">
          Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
        </div>
      </div>
    </main>
  );
}
