import type { Database } from '@/shared/lib/database.types'

/**
 * The menu domain types.
 *
 * They are no longer written by hand: they are cut out of
 * `shared/lib/database.types.ts`, which `npm run types:db` generates from the
 * real schema. Before that, these were a promise —a shape someone typed here
 * and repeated as `data as Dish[]` at every call site— and nothing checked
 * that Postgres agreed. Now renaming a column in a migration breaks the build
 * instead of arriving as `undefined` in a price.
 *
 * `Pick` and not the whole `Row`: the queries ask for these columns and not
 * `created_at` / `updated_at`, so claiming to have them would be the same lie
 * in the other direction.
 *
 * Note `price_cents`: the price is an integer number of cents, never a float —
 * see docs/panel.md §2.
 */
type Tables = Database['public']['Tables']

export type Category = Pick<
  Tables['categories']['Row'],
  'id' | 'name' | 'sort_order'
>

export type Dish = Pick<
  Tables['dishes']['Row'],
  | 'id'
  | 'name'
  | 'description'
  | 'price_cents'
  | 'category_id'
  | 'sort_order'
  | 'available'
  /** Path inside the Storage bucket, not a full URL. Null until it has one. */
  | 'photo_path'
>
