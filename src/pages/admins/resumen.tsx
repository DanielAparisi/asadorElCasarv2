import { Link } from 'react-router-dom'

/**
 * Lista de platos de la carta. Fase 3 de docs/panel.md.
 *
 * Pendiente: tabla de platos agrupada por categoría, con el precio, el
 * interruptor de "en carta / fuera de carta" y el enlace a edición.
 */
function Resumen() {
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

export default Resumen
