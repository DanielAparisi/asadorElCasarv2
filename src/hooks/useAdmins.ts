import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export type Admin = {
  id: number
  created_at: string
  name: string
}

/**
 * Lee la tabla Admins. La política de RLS solo devuelve filas si el usuario
 * autenticado es admin, así que llamar a este hook sin sesión da una lista vacía.
 */
export function useAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function getAdmins() {
      const { data, error } = await supabase
        .from('Admins')
        .select()
        .abortSignal(controller.signal)

      if (controller.signal.aborted) return

      if (error) setError(error.message)
      else setAdmins(data)

      setLoading(false)
    }

    getAdmins()
    return () => controller.abort()
  }, [])

  return { admins, loading, error }
}
