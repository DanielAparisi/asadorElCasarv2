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
