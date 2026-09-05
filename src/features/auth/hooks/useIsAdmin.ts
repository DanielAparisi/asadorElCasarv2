import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'

/**
 * Checks whether the user has a row in Admins.
 *
 * Nothing special is needed in the database: the RLS policy already returns
 * rows only to admins, so finding your own row is the same as being one. It
 * takes the id as an argument instead of calling useSession so it does not
 * open a second auth subscription.
 */
export function useIsAdmin(userId: string | undefined) {
  // Stored next to the id it was checked for, so the previous user's answer is
  // never taken as valid while the new one is still being checked.
  const [result, setResult] = useState<{
    userId: string
    isAdmin: boolean
  } | null>(null)

  useEffect(() => {
    if (!userId) return

    const controller = new AbortController()

    async function check() {
      const { data, error } = await supabase
        .from('Admins')
        .select('id')
        .eq('user_id', userId)
        .abortSignal(controller.signal)
        .maybeSingle()

      if (controller.signal.aborted) return

      setResult({ userId: userId!, isAdmin: !error && data !== null })
    }

    check()
    return () => controller.abort()
  }, [userId])

  if (!userId) return { isAdmin: false, loading: false }

  const checked = result?.userId === userId
  return { isAdmin: checked ? result.isAdmin : false, loading: !checked }
}
