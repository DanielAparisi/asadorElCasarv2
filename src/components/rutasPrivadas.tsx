import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useEsAdmin } from '../hooks/useEsAdmin'
import Spinner from './spinner'
import LoginPage from '../pages/loginPage'
import AdminLayout from '../pages/admins/layout'

/**
 * El control de acceso de /login y /admins.
 *
 * Está fuera de App a propósito. Mientras los hooks de sesión vivían allí,
 * `supabase-js` entraba en el chunk principal y todo visitante de la carta se
 * bajaba el cliente de autenticación para no usarlo nunca. App importa este
 * archivo con `lazy()`, así que Supabase solo llega al navegador de quien pisa
 * una ruta privada.
 *
 * Las dos rutas comparten módulo, y por tanto chunk: entrar por /login y pasar
 * a /admins no dispara una segunda descarga.
 *
 * Solo una de las dos está montada a la vez, así que sigue habiendo una única
 * suscripción de auth abierta. Cuando varias pantallas del panel necesiten la
 * sesión, el paso siguiente es el SessionContext de docs/panel.md §4.
 */
function useAcceso() {
  const { session, cargando: cargandoSesion } = useSession()
  const { esAdmin, cargando: cargandoAdmin } = useEsAdmin(session?.user.id)

  // Sin saber si hay sesión y si es admin no se puede decidir ninguna
  // redirección: al recargar en /admins expulsaríamos a un admin legítimo.
  return { session, esAdmin, decidiendo: cargandoSesion || cargandoAdmin }
}

export function RutaLogin() {
  const { session, esAdmin, decidiendo } = useAcceso()

  if (decidiendo) return <Spinner />
  if (session) return <Navigate to={esAdmin ? '/admins' : '/'} replace />

  return <LoginPage />
}

export function RutaAdmins() {
  const { session, esAdmin, decidiendo } = useAcceso()

  if (decidiendo) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!esAdmin) return <Navigate to="/404" replace />

  // El guard está aquí, en la ruta padre, y no en cada hija: cuando AdminLayout
  // se monta ya se sabe que hay sesión y que es admin.
  return <AdminLayout session={session} />
}
