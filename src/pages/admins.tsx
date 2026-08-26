import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useAdmins } from '../hooks/useAdmins'
import { useAuth } from '../hooks/useAuth'

// La sesión llega por props: App ya la tiene y así no se abre una segunda
// suscripción de auth para leer el correo.
function Admins({ session }: { session: Session }) {
  const { admins, loading, error, agregar, agregando, errorAlta } = useAdmins()
  const { salir } = useAuth()
  const [correo, setCorreo] = useState('')

  async function handleAlta(e: React.FormEvent) {
    e.preventDefault()
    const alta = await agregar(correo)
    if (alta) setCorreo('')
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold">Admins</h1>
        <span className="text-sm text-gray-600">{session.user.email}</span>
        <button onClick={salir} className="text-sm underline">
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
        <ul className="mb-8">
          {admins.map((admin) => (
            <li key={admin.id}>{admin.name}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAlta} className="max-w-sm border-t pt-6">
        <h2 className="font-semibold mb-1">Dar acceso a alguien</h2>
        <p className="text-sm text-gray-600 mb-3">
          La persona tiene que haberse registrado antes: aquí solo se le da el
          permiso de admin, no se le crea la cuenta.
        </p>

        <div className="flex gap-2">
          <input
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="border border-gray-300 rounded px-3 py-2 flex-1"
          />
          <button
            type="submit"
            disabled={agregando}
            className="bg-gray-800 text-white rounded px-4 disabled:opacity-50"
          >
            {agregando ? 'Añadiendo…' : 'Añadir'}
          </button>
        </div>

        {errorAlta && <p className="text-sm text-red-600 mt-2">{errorAlta}</p>}
      </form>
    </div>
  )
}

export default Admins
