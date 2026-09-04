import { useEffect, useState } from 'react'
import type { Category, Dish } from '../types'

/**
 * The restaurant menu, read from Supabase.
 *
 * Two things this hook used to do by hand now happen in the database:
 *
 *  - Unavailable dishes are filtered by the RLS policy `carta publica`, so
 *    they never even reach the client. There is no `.filter(available)` here
 *    on purpose — the panel's useDishes is the one that sees them.
 *  - The ordering comes from `order=sort_order`. Only the grouping by category
 *    is still done here: `category_id` was a usable sort key while the ids
 *    came from a hand written JSON, but the database assigns them in whatever
 *    order the rows were inserted, so "Para picar" ended up as id 1 and
 *    "Brasa" as id 2. What orders the menu is `categories.sort_order`.
 *
 * ⚠️ It does NOT use `supabase-js`, unlike every other hook in the project.
 * That is the whole point: this hook is the only piece of Supabase the public
 * landing page needs, and importing the client would put the library — 217 kB,
 * 57 kB gzipped — in the main chunk for every visitor who came to read the
 * prices. Two anonymous `select`s with no session and no realtime are two GETs
 * to PostgREST, which is what the library would send anyway.
 */

// Read here and not imported from shared/lib/supabaseEnv on purpose: a module
// shared with the panel gets bundled into the panel's chunk, and the landing
// would end up preloading it — which is the 57 kB this hook exists to avoid.
// Vite replaces `import.meta.env.VITE_*` at compile time, so this is a string
// in the bundle and costs nothing.
const REST = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// The `anon` key travels in both headers because PostgREST wants the role in
// the bearer token and the gateway wants the key: that is what supabase-js
// does under the hood.
const HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  Accept: 'application/json',
}

const DISH_COLUMNS = 'id,name,description,price_cents,category_id,sort_order,available,photo_path'

async function select<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${REST}/${path}`, { headers: HEADERS, signal })

  if (!response.ok) {
    // PostgREST answers errors as JSON with a `message`; if it did not, the
    // status is the only thing there is to say.
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? `Error ${response.status}`)
  }

  return response.json()
}

export function useMenu() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchMenu() {
      try {
        // Both at once: they do not depend on each other, and the menu is not
        // painted until both have arrived anyway.
        const [categoryRows, dishRows] = await Promise.all([
          select<Category[]>('categories?select=id,name,sort_order&order=sort_order', controller.signal),
          select<Dish[]>(`dishes?select=${DISH_COLUMNS}&order=sort_order`, controller.signal),
        ])

        setCategories(categoryRows)
        // Each category's dishes, in the order the categories go out.
        setDishes(
          categoryRows.flatMap((category) =>
            dishRows.filter((dish) => dish.category_id === category.id),
          ),
        )
      } catch (cause) {
        // An abort is not a failure: the component simply went away.
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar la carta')
      }

      if (!controller.signal.aborted) setLoading(false)
    }

    fetchMenu()
    return () => controller.abort()
  }, [])

  return { dishes, categories, loading, error }
}
