import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Comprueba si el usuario tiene fila en Admins.
 *
 * No hace falta nada especial en la base de datos: la política de RLS ya
 * devuelve filas solo a los admins, así que encontrar la propia fila equivale
 * a serlo. Recibe el id como argumento en lugar de llamar a useSession para no
 * abrir una segunda suscripción de auth.
 */
export function useEsAdmin(userId: string | undefined) {
  // Se guarda junto al id que se consultó, para no dar por bueno el resultado
  // del usuario anterior mientras se comprueba el nuevo.
  const [resultado, setResultado] = useState<{ userId: string; esAdmin: boolean } | null>(null)

  useEffect(() => {
    if (!userId) return

    const controller = new AbortController()

    async function comprobar() {
      const { data, error } = await supabase
        .from('Admins')
        .select('id')
        .eq('user_id', userId)
        .abortSignal(controller.signal)
        .maybeSingle()

      if (controller.signal.aborted) return

      setResultado({ userId: userId!, esAdmin: !error && data !== null })
    }

    comprobar()
    return () => controller.abort()
  }, [userId])

  if (!userId) return { esAdmin: false, cargando: false }

  const comprobado = resultado?.userId === userId
  return { esAdmin: comprobado ? resultado.esAdmin : false, cargando: !comprobado }
}
