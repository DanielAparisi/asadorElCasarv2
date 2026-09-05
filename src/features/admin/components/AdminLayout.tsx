import { NavLink, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * What every panel screen shares: navigation, who is signed in and the sign
 * out button.
 *
 * The guard is NOT here but on the parent route (see auth/ProtectedRoutes):
 * that way it is checked once for every child instead of being repeated in
 * each one. By the time this component mounts, we know there is a session and
 * that it belongs to an admin.
 *
 * The session arrives as a prop from the route, which is where the single auth
 * subscription lives. No child needs it yet: the email and the sign out button
 * are painted here. When one does, pass it down via `Outlet context`.
 */
function AdminLayout({ session }: { session: Session }) {
  const { signOut } = useAuth()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-6">
          <span className="font-semibold">Panel</span>

          <nav className="flex gap-4 text-sm">
            {/* `end` stops "Platos" from staying highlighted on child routes. */}
            <NavLink to="/admins" end className={navLinkClass}>
              Platos
            </NavLink>
            <NavLink to="/admins/categorias" className={navLinkClass}>
              Categorías
            </NavLink>
            <NavLink to="/admins/equipo" className={navLinkClass}>
              Equipo
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-gray-500">{session.user.email}</span>
            <button onClick={signOut} className="underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
