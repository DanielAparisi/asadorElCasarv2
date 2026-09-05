import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'

export type Admin = {
  id: number
  created_at: string
  name: string
}

/**
 * Reads the Admins table and grants admin access to new people.
 *
 * The RLS policy only returns rows if the authenticated user is an admin, so
 * calling this hook without a session yields an empty list.
 */
export function useAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchAdmins() {
      const { data, error } = await supabase
        .from('Admins')
        .select()
        .abortSignal(controller.signal)

      if (controller.signal.aborted) return

      if (error) setError(error.message)
      else setAdmins(data)

      setLoading(false)
    }

    fetchAdmins()
    return () => controller.abort()
  }, [])

  /**
   * Grants admin access to the account with that email address. The check that
   * the caller is an admin lives in the SQL function, not here: the client is
   * tamperable.
   *
   * Returns true if access was granted.
   */
  async function addAdmin(email: string) {
    setAdding(true)
    setAddError(null)

    const { data, error } = await supabase.rpc('add_admin', { email })
    setAdding(false)

    if (error) {
      // The messages come already worded from the SQL function.
      setAddError(error.message)
      return false
    }

    // Appended by hand instead of refetching the list: the row the function
    // returns is exactly the one that was just inserted.
    setAdmins((previous) => [...previous, data as Admin])
    return true
  }

  return { admins, loading, error, addAdmin, adding, addError }
}
