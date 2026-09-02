/**
 * The menu domain types.
 *
 * These are deliberately the exact columns of the future Supabase tables
 * (`categories`, `dishes`), so that swapping the JSON for a query is a change
 * inside `useMenu` and nothing else. Note `price_cents`: the price is an
 * integer number of cents, never a float — see docs/panel.md §2.
 */

export type Category = {
  id: number
  name: string
  sort_order: number
}

export type Dish = {
  id: number
  name: string
  description: string
  price_cents: number
  category_id: number
  sort_order: number
  available: boolean
  /** Path inside the Storage bucket, not a full URL. Null until it has one. */
  photo_path: string | null
}
