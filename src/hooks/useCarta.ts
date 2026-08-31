import carta from '../lib/carta.json'

/**
 * La carta del asador.
 *
 * Hoy lee un JSON del repo; mañana leerá las tablas `platos` y `categorias`
 * de Supabase (docs/panel.md, fase 1). Ese cambio debe quedarse dentro de
 * este archivo, y por eso:
 *
 *  - Los tipos son exactamente las columnas de las tablas futuras. Nada de
 *    `precio: "12,00 €"`: el precio va en céntimos, como en la base de datos.
 *  - Devuelve `{ platos, categorias, loading, error }` aunque hoy la lectura
 *    sea síncrona y loading valga siempre false. Los componentes ya
 *    contemplan la espera, así que el día del cambio no se tocan.
 */

export type Categoria = {
  id: number
  nombre: string
  orden: number
}

export type Plato = {
  id: number
  nombre: string
  descripcion: string
  precio_centimos: number
  categoria_id: number
  orden: number
  disponible: boolean
}

/** 1250 → "12,50 €". El formateo es cosa del cliente; la BBDD guarda enteros. */
export function formatearPrecio(centimos: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(centimos / 100)
}

// Se ordena aquí, una vez, y no en cada render: el JSON no cambia.
// En Supabase esto será un `.order('orden')` en la consulta.
const categorias: Categoria[] = [...carta.categorias].sort((a, b) => a.orden - b.orden)

// Sin `as Plato[]`: así TypeScript comprueba de verdad que el JSON tiene la
// forma de la tabla. El cast anterior tapaba que a los platos les faltaba
// `orden`, y el .sort() acababa comparando undefined.
const platos: Plato[] = carta.platos
  // Los no disponibles no salen en la carta pública. En Supabase lo hará la
  // política de RLS, que además impide siquiera leerlos.
  .filter((plato) => plato.disponible)
  .sort((a, b) => a.categoria_id - b.categoria_id || a.orden - b.orden)

export function useCarta() {
  return { platos, categorias, loading: false, error: null as string | null }
}
