import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/lib/supabase'
import type { Category, Dish } from '../types'

/**
 * The restaurant menu, read from Supabase.
 *
 * Two things this hook used to do by hand now happen in the database:
 *
 *  - Unavailable dishes are filtered by the RLS policy `carta publica`, so
 *    they never even reach the client. There is no `.filter(available)` here
 *    on purpose — the panel's useDishes is the one that sees them.
 *  - The ordering is `.order()`, not `.sort()`. Only the grouping by category
 *    is still done here: `category_id` was a usable sort key while the ids
 *    came from a hand written JSON, but the database assigns them in whatever
 *    order the rows were inserted, so "Para picar" ended up as id 1 and
 *    "Brasa" as id 2. What orders the menu is `categories.sort_order`.
 *
 * The returned shape is the same as when this read a JSON file, which is why
 * swapping it touched no component. What did change is that `loading` now
 * really starts as true and `error` is no longer always null.
 */
export function useMenu() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchMenu() {
      // Both queries at once: they do not depend on each other, and the menu
      // is not painted until both have arrived anyway.
      const [categoriesResult, dishesResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .order('sort_order')
          .abortSignal(controller.signal),
        supabase
          .from('dishes')
          .select('id, name, description, price_cents, category_id, sort_order, available')
          .order('sort_order')
          .abortSignal(controller.signal),
      ])

      if (controller.signal.aborted) return

      const failed = categoriesResult.error ?? dishesResult.error
      if (failed) {
        setError(failed.message)
      } else {
        const orderedCategories = categoriesResult.data as Category[]
        setCategories(orderedCategories)
        // Each category's dishes, in the order the categories go out. Doing it
        // here and not with a join keeps the row shape equal to the table.
        setDishes(
          orderedCategories.flatMap((category) =>
            (dishesResult.data as Dish[]).filter((dish) => dish.category_id === category.id),
          ),
        )
      }

      setLoading(false)
    }

    fetchMenu()
    return () => controller.abort()
  }, [])

  return { dishes, categories, loading, error }
}
