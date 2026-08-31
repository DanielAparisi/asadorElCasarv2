import { useState } from 'react'
import { supabase } from '../../../shared/lib/supabase'

/**
 * Calls into Supabase Auth, with submit state and result messages.
 *
 * Form state (email, password, mode) is deliberately left out: only
 * credentials come in as arguments, so the hook can serve any form.
 */
export function useAuth() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function clearMessages() {
    setError(null)
    setNotice(null)
  }

  /** Returns true if the account was created. */
  async function signUp(email: string, password: string) {
    setSubmitting(true)
    clearMessages()

    const { data, error } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return false
    }

    // With email confirmation enabled there is a user but not yet a session,
    // so waiting for onAuthStateChange is not enough.
    if (!data.session) {
      setNotice('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
    }

    return true
  }

  /** Returns true if the session was opened; useSession handles the rest. */
  async function signIn(email: string, password: string) {
    setSubmitting(true)
    clearMessages()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return false
    }

    return true
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) setError(error.message)
  }

  return { signUp, signIn, signOut, submitting, error, notice, clearMessages }
}
