// Point d'atterrissage des liens envoyés par e-mail (confirmation
// d'inscription, réinitialisation de mot de passe…). Supabase renvoie ici
// avec un "code" à échanger contre une vraie session (cookies), puis on
// redirige vers la page voulue (?next=).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // On n'autorise que des redirections internes (évite un open redirect).
  const nextParam = searchParams.get("next") || "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // En prod derrière le proxy Vercel, l'hôte réel est dans x-forwarded-host.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      if (!isLocal && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Lien invalide ou expiré : on renvoie vers l'écran le plus utile selon le
  // parcours (réinitialisation de mot de passe, ou connexion sinon).
  const fallback = next === "/nouveau-mot-de-passe" ? "/mot-de-passe-oublie?erreur=lien" : "/connexion";
  return NextResponse.redirect(`${origin}${fallback}`);
}
