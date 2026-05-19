import { createClient } from "@supabase/supabase-js";

const url     = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const HAS_SUPABASE = Boolean(url && anonKey);

if (!HAS_SUPABASE) {
  console.warn(
    "ℹ️  Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).\n" +
    "    L'app tourne en mode DÉMO local (données en mémoire).\n" +
    "    Voir .env.example pour activer la persistance."
  );
}

export const supabase = HAS_SUPABASE
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
