import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/home'
import Page404 from './pages/404'
import Spinner from './components/spinner'

// La carta pública (Home) va en el bundle principal: es lo que viene a ver la
// mayoría y no debe esperar a ninguna descarga extra.
//
// Todo lo privado se carga aparte. Lo usan tres o cuatro personas; que cada
// visitante del asador se baje el panel —y con él supabase-js entero— no tiene
// sentido. Por eso el control de acceso vive en rutasPrivadas y no aquí: si
// App importase los hooks de sesión, Supabase volvería al chunk principal.
const RutaLogin = lazy(() =>
  import('./components/rutasPrivadas').then((m) => ({ default: m.RutaLogin })),
)
const RutaAdmins = lazy(() =>
  import('./components/rutasPrivadas').then((m) => ({ default: m.RutaAdmins })),
)
const Resumen = lazy(() => import('./pages/admins/resumen'))
const PlatoNuevo = lazy(() => import('./pages/admins/platoNuevo'))
const PlatoEditar = lazy(() => import('./pages/admins/platoEditar'))
const Categorias = lazy(() => import('./pages/admins/categorias'))
const Equipo = lazy(() => import('./pages/admins/equipo'))

function App() {
  return (
    <BrowserRouter>
      {/* Home y el 404 no son lazy, así que en `/` no hay suspensión y este
          fallback nunca llega a pintarse. */}
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<RutaLogin />} />

          <Route path="/admins" element={<RutaAdmins />}>
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
      </Suspense>
    </BrowserRouter>
  )
}

export default App
