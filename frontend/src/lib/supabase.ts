import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedAccessToken: string | null = null;
let accessTokenPromise: Promise<string | null> | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedAccessToken = session?.access_token ?? null;
  accessTokenPromise = null;
});

export async function getSupabaseAccessToken() {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  if (!accessTokenPromise) {
    accessTokenPromise = supabase.auth.getSession().then(({ data }) => {
      cachedAccessToken = data.session?.access_token ?? null;
      return cachedAccessToken;
    }).finally(() => {
      accessTokenPromise = null;
    });
  }

  return accessTokenPromise;
}
