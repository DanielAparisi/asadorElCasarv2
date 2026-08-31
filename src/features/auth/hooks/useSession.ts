import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../shared/lib/supabase'

/**
 * The active Supabase Auth session.
 *
 * `loading` tells "I do not know yet whether there is a session" apart from
 * "there is no session": on start-up, reading the session from localStorage is
 * async, so without this flag an already logged-in user would be shown the
 * login screen for an instant.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // getSession() and onAuthStateChange run in parallel with no guarantee of
    // which finishes first. If the listener gets there first — it fires
    // INITIAL_SESSION almost immediately, and a token refresh or a login can
    // land right after — the late .then() would overwrite the good session
    // with the snapshot it took at the start. Once the listener has spoken it
    // becomes the only source of truth.
    let listenerHasSpoken = false

    supabase.auth.getSession().then(({ data }) => {
      if (!listenerHasSpoken) setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      listenerHasSpoken = true
      setSession(nextSession)
      // Here too: if getSession() stalls, do not leave the app stuck on the
      // spinner when the answer is already in.
      setLoading(false)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return { session, loading }
}
