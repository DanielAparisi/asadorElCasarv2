import { Link, useParams } from 'react-router-dom'

/**
 * Editing a dish. Phase 3 of docs/panel.md.
 *
 * Pending: load the dish by id and hand it to DishForm as initial values. If
 * the id does not exist, a 404 rather than an empty form.
 */
function EditDishPage() {
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

export default EditDishPage
