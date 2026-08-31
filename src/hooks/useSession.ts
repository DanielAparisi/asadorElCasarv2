import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

/**
 * Sesión activa de Supabase Auth.
 *
 * `cargando` distingue "todavía no sé si hay sesión" de "no hay sesión": al
 * arrancar, leer la sesión de localStorage es asíncrono, así que sin esta
 * bandera se pintaría el login durante un instante a un usuario ya logueado.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // getSession() y onAuthStateChange corren en paralelo y no hay garantía de
    // cuál termina antes. Si el listener se adelanta —al arrancar dispara
    // INITIAL_SESSION casi de inmediato, y un refresco de token o un login
    // pueden llegar justo después— el .then() tardío pisaría la sesión buena
    // con la foto que sacó al empezar. Esta bandera hace que el listener,
    // una vez ha hablado, sea la única fuente de verdad.
    let mandaElListener = false

    supabase.auth.getSession().then(({ data }) => {
      if (!mandaElListener) setSession(data.session)
      setCargando(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      mandaElListener = true
      setSession(sesion)
      // También aquí: si getSession() se atasca, no dejamos la app colgada en
      // el spinner teniendo ya la respuesta.
      setCargando(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, cargando }
}
