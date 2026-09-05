import type { Category, Dish } from './types'

/**
 * Checks that what PostgREST answered is really a menu.
 *
 * This is the one place in the project where data crosses into the app without
 * a compiler in the middle. Everywhere else supabase-js carries the generated
 * `Database` type, so a renamed column stops the build; here the response is
 * parsed JSON, and `useMenu`'s `select<T>()` is a generic — that is, a promise
 * about a value nobody looked at.
 *
 * What it buys is not defence against an attacker: whoever can change what this
 * endpoint returns has the database. It is the difference between a menu that
 * says *"no hemos podido cargar la carta"* and a menu that paints six cards
 * reading `NaN €`, which is what `price_cents: undefined` renders as after
 * `Intl.NumberFormat` gets hold of it. A wrong price on a restaurant page is
 * worse than no page.
 *
 * ⚠️ The shapes below cannot drift from the types. `Shape<T>` is a mapped type
 * over every key of `T` with the optionals stripped (`-?`), so adding a column
 * to `Dish` and forgetting it here does not compile, and neither does checking
 * a field that no longer exists. That is what makes this a second reading of
 * the schema rather than a third copy of it.
 */

type FieldCheck = (value: unknown) => boolean

/** One check per key of T, none missing and none extra. */
type Shape<T> = { [K in keyof T]-?: FieldCheck }

// `Number.isFinite` and not `typeof === 'number'`: JSON can hold a number that
// arrives as NaN through a bad serialisation, and NaN is exactly the value this
// file exists to keep out of a price.
const isNumber: FieldCheck = (value) =>
  typeof value === 'number' && Number.isFinite(value)
const isString: FieldCheck = (value) => typeof value === 'string'
const isBoolean: FieldCheck = (value) => typeof value === 'boolean'
const isNullOr =
  (check: FieldCheck): FieldCheck =>
  (value) =>
    value === null || check(value)

const CATEGORY_SHAPE: Shape<Category> = {
  id: isNumber,
  name: isString,
  sort_order: isNumber,
}

const DISH_SHAPE: Shape<Dish> = {
  id: isNumber,
  name: isString,
  description: isString,
  price_cents: isNumber,
  category_id: isNumber,
  sort_order: isNumber,
  available: isBoolean,
  photo_path: isNullOr(isString),
}

/**
 * Every row or none.
 *
 * Skipping the bad ones and painting the rest would be worse: a row that does
 * not match means the schema and the app disagree, which is never about that
 * one row. A menu missing a dish nobody notices; a menu that fails says what
 * happened.
 *
 * The offending row goes to the console because the message cannot carry it —
 * what the visitor sees is a single friendly sentence (MenuSection), and this
 * is the only trace left for whoever has to work out why.
 */
function checkRows<T>(value: unknown, shape: Shape<T>, table: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`La respuesta de ${table} no es una lista.`)
  }

  for (const row of value) {
    if (typeof row !== 'object' || row === null) {
      throw new Error(`Una fila de ${table} no es un objeto.`)
    }

    for (const [field, check] of Object.entries(shape) as [
      string,
      FieldCheck,
    ][]) {
      if (!check((row as Record<string, unknown>)[field])) {
        console.error(`Fila de ${table} con "${field}" inesperado:`, row)
        throw new Error(`La columna "${field}" de ${table} llegó mal.`)
      }
    }
  }

  return value as T[]
}

export const parseCategories = (value: unknown) =>
  checkRows(value, CATEGORY_SHAPE, 'categories')

export const parseDishes = (value: unknown) =>
  checkRows(value, DISH_SHAPE, 'dishes')
