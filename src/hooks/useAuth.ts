import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Llamadas a Supabase Auth, con el estado de envío y los mensajes de resultado.
 *
 * El estado del formulario (email, contraseña, modo) se queda deliberadamente
 * fuera: aquí solo entran credenciales como argumentos, para que el hook sirva
 * a cualquier formulario.
 */
export function useAuth() {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  function limpiarMensajes() {
    setError(null)
    setAviso(null)
  }

  /** Devuelve true si la cuenta se creó. */
  async function registrar(email: string, password: string) {
    setEnviando(true)
    limpiarMensajes()

    const { data, error } = await supabase.auth.signUp({ email, password })
    setEnviando(false)

    if (error) {
      setError(error.message)
      return false
    }

    // Con la confirmación por email activada hay usuario pero todavía no hay
    // sesión, así que no basta con esperar a onAuthStateChange.
    if (!data.session) {
      setAviso('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
    }

    return true
  }

  /** Devuelve true si la sesión se abrió; useSession se encarga del resto. */
  async function entrar(email: string, password: string) {
    setEnviando(true)
    limpiarMensajes()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setEnviando(false)

    if (error) {
      setError(error.message)
      return false
    }

    return true
  }

  async function salir() {
    const { error } = await supabase.auth.signOut()
    if (error) setError(error.message)
  }

  return { registrar, entrar, salir, enviando, error, aviso, limpiarMensajes }
}
