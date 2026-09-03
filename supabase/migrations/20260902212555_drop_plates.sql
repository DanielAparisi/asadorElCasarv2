/**
 * Drops `public.plates`, the prototype that `dishes` replaced.
 *
 * It was the first sketch of the menu — `title`, `price` as whole euros,
 * `available` — with a single test row in it ("pollo asado", 12). Nothing read
 * it: the app has never mentioned it.
 *
 * It is not being dropped for tidiness. It was created before
 * `20260826100433_seguridad_permisos_por_defecto.sql`, back when every new
 * table of `public` inherited `insert`, `update` and `delete` for `anon`, and
 * it kept those grants. Row level security was covering it —the `ensure_rls`
 * event trigger enables RLS on every new table and this one has no policies,
 * so nobody could read or write it— but that is exactly the single layer of
 * defence that migration exists to stop relying on. A table nobody uses,
 * writable on paper by anonymous visitors, is a table to delete.
 *
 * The rows are not migrated anywhere: `dishes` already carries the real menu,
 * with the price in cents rather than whole euros.
 */
drop table if exists public."plates";
