import { useState } from 'react'
import { useAdmins } from '../hooks/useAdmins'

/**
 * Granting admin access. This was the whole /admins page before the panel had
 * several screens.
 *
 * The email and the sign out button are no longer here: the layout paints them.
 */
function TeamPage() {
  const { admins, loading, error, addAdmin, adding, addError } = useAdmins()
  const [email, setEmail] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const added = await addAdmin(email)
    if (added) setEmail('')
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Equipo</h1>

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

      <form onSubmit={handleSubmit} className="max-w-sm border-t pt-6">
        <h2 className="font-semibold mb-1">Dar acceso a alguien</h2>
        <p className="text-sm text-gray-600 mb-3">
          La persona tiene que haberse registrado antes: aquí solo se le da el permiso de admin, no
          se le crea la cuenta.
        </p>

        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            className="border border-gray-300 rounded px-3 py-2 flex-1 bg-white"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-gray-800 text-white rounded px-4 disabled:opacity-50"
          >
            {adding ? 'Añadiendo…' : 'Añadir'}
          </button>
        </div>

        {addError && <p className="text-sm text-red-600 mt-2">{addError}</p>}
      </form>
    </div>
  )
}

export default TeamPage
