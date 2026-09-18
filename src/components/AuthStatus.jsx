"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthStatus() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pseudo, setPseudo] = useState(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadFromUser(user) {
      setLoggedIn(!!user);
      if (!user) {
        setPseudo(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("pseudo")
        .eq("id", user.id)
        .maybeSingle();
      setPseudo(profile?.pseudo || null);
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      loadFromUser(user).finally(() => setLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadFromUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) return null;

  if (!loggedIn) {
    return (
      <div className="auth-status">
        <Link className="btn-ghost" href="/connexion">
          Connexion
        </Link>
        <Link className="cta" href="/inscription">
          Inscription
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-status">
      <Link className="btn-ghost" href="/compte">
        {pseudo || "Mon compte"}
      </Link>
      <button className="btn-ghost danger" type="button" onClick={handleLogout}>
        Déconnexion
      </button>
    </div>
  );
}
