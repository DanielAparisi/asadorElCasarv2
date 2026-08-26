import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { useEsAdmin } from './hooks/useEsAdmin'
import Home from './pages/home'
import LoginPage from './pages/loginPage'
import Page404 from './pages/404'
import Spinner from './components/spinner'
import AdminLayout from './pages/admins/layout'
import Resumen from './pages/admins/resumen'
import PlatoNuevo from './pages/admins/platoNuevo'
import PlatoEditar from './pages/admins/platoEditar'
import Categorias from './pages/admins/categorias'
import Equipo from './pages/admins/equipo'

function App() {
  const { session, cargando: cargandoSesion } = useSession()
  const { esAdmin, cargando: cargandoAdmin } = useEsAdmin(session?.user.id)

  // Sin saber si hay sesión y si es admin no se puede decidir ninguna
  // redirección: al recargar en /admins expulsaríamos a un admin legítimo.
  if (cargandoSesion || cargandoAdmin) return <Spinner />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Ya con sesión, /login no tiene sentido: reparte según el rol. */}
        <Route
          path="/login"
          element={
            session ? <Navigate to={esAdmin ? '/admins' : '/'} replace /> : <LoginPage />
          }
        />

        {/* Un único guard para todo el panel: se comprueba aquí y las hijas se
            montan dentro del Outlet del layout, ya sabiendo que hay permiso.
            Este guard es comodidad, no seguridad — quien lo salte se topa con
            el RLS de Postgres. Ver docs/seguridad.md.

            Quien no es admin va al 404, no a una página de "sin permiso": así
            no se le confirma que la ruta existe. */}
        <Route
          path="/admins"
          element={
            session && esAdmin ? (
              <AdminLayout session={session} />
            ) : (
              <Navigate to={session ? '/404' : '/login'} replace />
            )
          }
        >
          <Route index element={<Resumen />} />
          <Route path="platos/nuevo" element={<PlatoNuevo />} />
          <Route path="platos/:id" element={<PlatoEditar />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="equipo" element={<Equipo />} />
          {/* /admins/loquesea cae aquí, dentro del layout, en vez de sacar al
              admin del panel. */}
          <Route path="*" element={<Page404 />} />
        </Route>

        <Route path="/404" element={<Page404 />} />
        {/* Se renderiza en su sitio, sin redirigir, para conservar la URL
            que el usuario escribió. */}
        <Route path="*" element={<Page404 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
