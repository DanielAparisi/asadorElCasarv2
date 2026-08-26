import { Link, useParams } from 'react-router-dom'

/**
 * Edición de un plato. Fase 3 de docs/panel.md.
 *
 * Pendiente: cargar el plato por id y pasárselo a PlatoForm como valores
 * iniciales. Si el id no existe, 404 en lugar de un formulario vacío.
 */
function PlatoEditar() {
  const { id } = useParams()

  return (
    <div>
      <Link to="/admins" className="text-sm underline text-gray-500">
        ← Volver a platos
      </Link>

      <h1 className="text-xl font-semibold mt-4 mb-6">Editar plato</h1>

      <p className="text-gray-500">Formulario pendiente. Id de la ruta: {id}</p>
    </div>
  )
}

export default PlatoEditar
