/**
 * 1250 → "12,50 €".
 *
 * Formatting belongs to the client; the database stores plain integers.
 */
export function formatPrice(cents: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

/**
 * "12,50" → 1250. Returns null if what was typed is not a price.
 *
 * The panel types euros and the table stores cents, so this conversion exists
 * exactly once, here next to its inverse. Three spellings have to give the
 * same number: "12,50", "12.50" and "12,5" — the Spanish decimal comma is the
 * common one and `parseFloat` does not understand it.
 *
 * `Math.round` and not a cast: 12.5 * 100 is not always 1250 in binary
 * floating point, which is the whole reason the column is an integer.
 */
export function parsePriceToCents(input: string): number | null {
  const normalized = input.trim().replace(',', '.')

  // At most two decimals: "12,555" is a typo, not half a cent.
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null

  return Math.round(Number(normalized) * 100)
}

/**
 * 1250 → "12,50", the way it goes into the form's input.
 *
 * Not `formatPrice`: the field holds a number to be edited, and the "€" of the
 * formatted version would come back in as text the next time it is saved.
 */
export function centsToPriceInput(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',')
}
