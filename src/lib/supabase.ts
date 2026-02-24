import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.warn(
      "Supabase: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis dans .env (ou dans les variables d'environnement Vercel en production)"
    );
  }
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
