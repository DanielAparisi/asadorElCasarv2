/**
 * The two public values of the Supabase project.
 *
 * They live apart from `supabase.ts` so that reading them does not drag
 * `supabase-js` along: the public menu asks for its two tables with `fetch`
 * (see features/menu/hooks/useMenu.ts) and the library — 57 kB gzipped — is
 * only downloaded by whoever opens the panel.
 *
 * Both are publishable by design: in a 100% client app everything Vite injects
 * ends up in the bundle. What protects the data is RLS, not secrecy.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Without this, a missing .env reaches `createClient` as undefined and the
// failure shows up later, in the first query, with a message that never
// mentions the variable that is missing (docs/cleanCode.md §6).
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env',
  )
}
