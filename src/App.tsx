import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import Login from './components/login'

type Admin = {
  id: number
  created_at: string
  name: string
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargandoSesion(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setSession(sesion)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  if (cargandoSesion) return <p>Cargando…</p>
  if (!session) return <Login />

  return <Admins email={session.user.email ?? ''} />
}

function Admins({ email }: { email: string }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function getAdmins() {
      const { data, error } = await supabase
        .from('Admins')
        .select()
        .abortSignal(controller.signal)

      if (controller.signal.aborted) return

      if (error) setError(error.message)
      else setAdmins(data)

      setLoading(false)
    }

    getAdmins()
    return () => controller.abort()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-xl font-semibold">Admins</h1>
        <span className="text-sm text-gray-600">{email}</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm underline"
        >
          Cerrar sesión
        </button>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : admins.length === 0 ? (
        <p>No hay admins todavía.</p>
      ) : (
        <ul>
          {admins.map((admin) => (
            <li key={admin.id}>{admin.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
