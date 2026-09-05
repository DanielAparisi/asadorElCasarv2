import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useIsAdmin } from '../hooks/useIsAdmin'
import LoginPage from '../pages/LoginPage'
import AdminLayout from '@/features/admin/components/AdminLayout'
import Spinner from '@/shared/components/Spinner'

/**
 * Access control for /login and /admins.
 *
 * This lives outside App on purpose. While the session hooks lived there,
 * `supabase-js` ended up in the main chunk and every visitor to the public
 * menu downloaded the auth client never to use it. App imports this file with
 * `lazy()`, so Supabase only reaches the browser of someone who hits a private
 * route.
 *
 * Both routes share this module and therefore its chunk: going from /login to
 * /admins does not trigger a second download.
 *
 * Only one of the two is mounted at a time, so there is still a single auth
 * subscription open. When several panel screens need the session, the next
 * step is the SessionContext from docs/panel.md §4.
 */
function useAccess() {
  const { session, loading: sessionLoading } = useSession()
  const { isAdmin, loading: adminLoading } = useIsAdmin(session?.user.id)

  // Without knowing whether there is a session and whether it is an admin, no
  // redirect can be decided: reloading on /admins would throw out a legitimate
  // admin.
  return { session, isAdmin, deciding: sessionLoading || adminLoading }
}

export function LoginRoute() {
  const { session, isAdmin, deciding } = useAccess()

  if (deciding) return <Spinner />
  if (session) return <Navigate to={isAdmin ? '/admins' : '/'} replace />

  return <LoginPage />
}

export function AdminRoute() {
  const { session, isAdmin, deciding } = useAccess()

  if (deciding) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/404" replace />

  // The guard is here, on the parent route, and not in each child: by the time
  // AdminLayout mounts we know there is a session and that it is an admin.
  return <AdminLayout session={session} />
}
