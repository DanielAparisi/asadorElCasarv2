import { Link } from 'react-router-dom'

/**
 * Alta de un plato. Fase 3 de docs/panel.md.
 *
 * Pendiente: PlatoForm con valores vacíos. El mismo componente que usa la
 * edición, para que los dos formularios no se separen con el tiempo.
 */
function PlatoNuevo() {
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

export default PlatoNuevo
