import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export type Admin = {
  id: number
  created_at: string
  name: string
}

/**
 * Lee la tabla Admins y da de alta admins nuevos.
 *
 * La política de RLS solo devuelve filas si el usuario autenticado es admin,
 * así que llamar a este hook sin sesión da una lista vacía.
 */
export function useAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [errorAlta, setErrorAlta] = useState<string | null>(null)

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

  /**
   * Da el alta a la cuenta que tenga ese correo. La comprobación de que quien
   * llama es admin está en la función SQL, no aquí: el cliente es manipulable.
   *
   * Devuelve true si se dio de alta.
   */
  async function agregar(correo: string) {
    setAgregando(true)
    setErrorAlta(null)

    const { data, error } = await supabase.rpc('agregar_admin', { correo })
    setAgregando(false)

    if (error) {
      // Los mensajes vienen ya redactados desde la función SQL.
      setErrorAlta(error.message)
      return false
    }

    // Se añade a mano en vez de recargar la lista: la fila que devuelve la
    // función es exactamente la que se acaba de insertar.
    setAdmins((previos) => [...previos, data as Admin])
    return true
  }

  return { admins, loading, error, agregar, agregando, errorAlta }
}
