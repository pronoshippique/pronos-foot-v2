// Client Supabase "administrateur" avec la clé service_role.
// ⚠️ SERVEUR UNIQUEMENT — ne jamais importer ce fichier dans un composant client.
// Il contourne la RLS : réservé au futur webhook Stripe (étape 8), qui doit
// pouvoir mettre à jour l'abonnement de n'importe quel profil.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
