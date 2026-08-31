import { Link } from 'react-router-dom'

/**
 * List of the dishes on the menu. Phase 3 of docs/panel.md.
 *
 * Pending: a table of dishes grouped by category, with the price, the
 * "on menu / off menu" switch and the link to edit.
 */
function DishesPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold">Platos</h1>
        <Link
          to="/admins/platos/nuevo"
          className="ml-auto bg-gray-800 text-white rounded px-4 py-2 text-sm"
        >
          Añadir plato
        </Link>
      </div>

      <p className="text-gray-500">
        Todavía no hay tabla de platos: falta crearla en la base de datos.
      </p>
    </div>
  )
}

export default DishesPage
