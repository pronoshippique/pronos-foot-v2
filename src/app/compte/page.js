import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lancementGratuit } from "@/lib/abonnement";
import { stripeConfigure } from "@/lib/stripe";
import AuthHeader from "@/components/AuthHeader";
import Abonnement from "@/components/Abonnement";

export const metadata = {
  title: "Mon compte — Pronos Foot",
};

export default async function ComptePage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pseudo, abonnement_statut, abonnement_fin, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const sp = await searchParams;

  return (
    <>
      <AuthHeader />
      <main className="wrap account-main">
        <div className="account-col">
          <h1 className="auth-title">Mon compte</h1>

          <div className="account-card">
            <div className="account-card-title">{profile?.pseudo || "Mon profil"}</div>
            <div className="account-status">{user.email}</div>
          </div>

          <Abonnement
            profile={profile}
            paiementActif={stripeConfigure()}
            lancementGratuit={lancementGratuit()}
            flash={sp?.abonnement || null}
          />
        </div>
      </main>
    </>
  );
}
