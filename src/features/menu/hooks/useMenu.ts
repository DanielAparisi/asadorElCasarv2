import menu from '../data/menu.json'
import type { Category, Dish } from '../types'

/**
 * The restaurant menu.
 *
 * Today it reads a JSON file from the repo; tomorrow it will read the
 * `dishes` and `categories` tables from Supabase (docs/panel.md, phase 1).
 * That change must stay inside this file, which is why:
 *
 *  - The types are exactly the columns of the future tables (see ../types).
 *  - It returns `{ dishes, categories, loading, error }` even though today the
 *    read is synchronous and `loading` is always false. Components already
 *    account for the wait, so on the day of the swap they are not touched.
 */

// Sorted here once, not on every render: the JSON never changes.
// In Supabase this becomes an `.order('sort_order')` in the query.
const categories: Category[] = [...menu.categories].sort((a, b) => a.sort_order - b.sort_order)

// No `as Dish[]` cast: this is how TypeScript actually verifies that the JSON
// has the shape of the table. A cast here used to hide a missing `sort_order`,
// and the sort ended up comparing undefined.
const dishes: Dish[] = menu.dishes
  // Unavailable dishes stay out of the public menu. In Supabase the RLS policy
  // will do this, and will not even let them be read.
  .filter((dish) => dish.available)
  .sort((a, b) => a.category_id - b.category_id || a.sort_order - b.sort_order)

export function useMenu() {
  return { dishes, categories, loading: false, error: null as string | null }
}
