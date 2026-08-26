import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { useEsAdmin } from './hooks/useEsAdmin'
import Home from './pages/home'
import LoginPage from './pages/loginPage'
import Admins from './pages/admins'
import Page404 from './pages/404'

function App() {
  const { session, cargando: cargandoSesion } = useSession()
  const { esAdmin, cargando: cargandoAdmin } = useEsAdmin(session?.user.id)

  // Sin saber si hay sesión y si es admin no se puede decidir ninguna
  // redirección: al recargar en /admins expulsaríamos a un admin legítimo.
  if (cargandoSesion || cargandoAdmin) return <p>Cargando…</p>

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

        {/* Quien no es admin va al 404, no a una página de "sin permiso":
            así no se le confirma que la ruta existe. */}
        <Route
          path="/admins"
          element={
            session && esAdmin ? <Admins session={session} /> : <Navigate to={session ? '/404' : '/login'} replace />
          }
        />

        <Route path="/404" element={<Page404 />} />
        {/* Se renderiza en su sitio, sin redirigir, para conservar la URL
            que el usuario escribió. */}
        <Route path="*" element={<Page404 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
