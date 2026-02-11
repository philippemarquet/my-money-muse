import { createClient } from "@supabase/supabase-js";

const url = (import.meta as any)?.env?.VITE_SUPABASE_URL;
const anon = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Deze console error is expres duidelijk zodat je meteen ziet wat er mis is in Lovable/Vercel env settings.
  console.error(
    "[Supabase] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. " +
      "Set them as environment variables in your runtime (Lovable/Vercel/Netlify)."
  );
}

export const supabase = createClient(url ?? "", anon ?? "");
