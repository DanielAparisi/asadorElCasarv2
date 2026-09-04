import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabaseEnv'

/**
 * The Supabase client, created once for the whole app.
 *
 * Only the panel imports it. The public menu deliberately does not: it reads
 * its two tables with `fetch` so that no visitor of the landing page
 * downloads the library (see features/menu/hooks/useMenu.ts).
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
