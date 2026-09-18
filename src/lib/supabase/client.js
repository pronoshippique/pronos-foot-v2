// Client Supabase côté NAVIGATEUR (composants "use client").
// Utilise la clé publique (anon) : elle peut apparaître dans le navigateur,
// c'est la RLS qui protège les données.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
