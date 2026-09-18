// Client Supabase côté SERVEUR (composants serveur, routes API).
// Lit/écrit la session dans les cookies. Utilise aussi la clé publique (anon)
// avec la session de l'utilisateur : la RLS s'applique donc à ses droits.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : on peut ignorer,
            // le proxy (src/proxy.js) rafraîchira la session.
          }
        },
      },
    }
  );
}
