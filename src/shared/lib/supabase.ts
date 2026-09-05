import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabaseEnv'

/**
 * The Supabase client, created once for the whole app.
 *
 * Only the panel imports it. The public menu deliberately does not: it reads
 * its two tables with `fetch` so that no visitor of the landing page
 * downloads the library (see features/menu/hooks/useMenu.ts).
 *
 * Typed with the generated `Database`, which is what lets every hook drop its
 * `data as Dish[]`: with the schema in the type, supabase-js already knows the
 * shape of what each `select` returns, and a column that changes name in a
 * migration stops compiling here instead of failing in the browser. Regenerate
 * with `npm run types:db` after every migration.
 */
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
)
