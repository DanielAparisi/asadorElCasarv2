import { NavLink, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { useAuth } from '../../hooks/useAuth'

/**
 * Lo que comparten todas las pantallas del panel: navegación, quién ha entrado
 * y el botón de salir.
 *
 * El guard NO está aquí sino en la ruta padre de App.tsx: así se comprueba una
 * sola vez para todas las hijas, en lugar de repetirlo en cada una. Cuando este
 * componente se monta, ya se sabe que hay sesión y que es admin.
 *
 * La sesión llega por props desde App, que es donde vive la única suscripción
 * de auth. Ninguna hija la necesita todavía: el correo y el botón de salir se
 * pintan aquí. Cuando alguna la necesite, se le pasa por `Outlet context`.
 */
function AdminLayout({ session }: { session: Session }) {
  const { salir } = useAuth()

  const estilo = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-6">
          <span className="font-semibold">Panel</span>

          <nav className="flex gap-4 text-sm">
            {/* `end` evita que "Platos" se quede marcado en las rutas hijas. */}
            <NavLink to="/admins" end className={estilo}>
              Platos
            </NavLink>
            <NavLink to="/admins/categorias" className={estilo}>
              Categorías
            </NavLink>
            <NavLink to="/admins/equipo" className={estilo}>
              Equipo
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-gray-500">{session.user.email}</span>
            <button onClick={salir} className="underline">
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
