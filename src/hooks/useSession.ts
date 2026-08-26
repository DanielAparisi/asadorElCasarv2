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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargando(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setSession(sesion)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, cargando }
}
