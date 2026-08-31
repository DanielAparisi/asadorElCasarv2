import { Link } from 'react-router-dom'

/**
 * Creating a dish. Phase 3 of docs/panel.md.
 *
 * Pending: a DishForm with empty values. The same component the edit screen
 * uses, so the two forms do not drift apart over time.
 */
function NewDishPage() {
  return (
    <div>
      <Link to="/admins" className="text-sm underline text-gray-500">
        ← Volver a platos
      </Link>

      <h1 className="text-xl font-semibold mt-4 mb-6">Nuevo plato</h1>

      <p className="text-gray-500">Formulario pendiente.</p>
    </div>
  )
}

export default NewDishPage
