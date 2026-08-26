import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { useEsAdmin } from './hooks/useEsAdmin'
import Login from './components/login'
import Home from './pages/home'
import Admins from './pages/admins'

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
            session ? <Navigate to={esAdmin ? '/admins' : '/'} replace /> : <Login />
          }
        />

        <Route
          path="/admins"
          element={
            session && esAdmin ? <Admins /> : <Navigate to={session ? '/' : '/login'} replace />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
