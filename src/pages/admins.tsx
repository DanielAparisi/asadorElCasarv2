import { useAdmins } from '../hooks/useAdmins'
import { useAuth } from '../hooks/useAuth'
import { useSession } from '../hooks/useSession'

function Admins() {
  const { session } = useSession()
  const { admins, loading, error } = useAdmins()
  const { salir } = useAuth()

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-xl font-semibold">Admins</h1>
        <span className="text-sm text-gray-600">{session?.user.email}</span>
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
        <ul>
          {admins.map((admin) => (
            <li key={admin.id}>{admin.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Admins
