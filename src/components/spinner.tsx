import { useEffect, useState } from 'react'
import './spinner.css'

/**
 * Indicador de carga a pantalla completa.
 *
 * Espera `retrasoMs` antes de aparecer. Leer la sesión de localStorage suele
 * tardar milisegundos, y un spinner que aparece y desaparece en 50 ms se ve
 * como un parpadeo: molesta más que un instante en blanco. Si la carga es
 * rápida, aquí no se llega a ver nada.
 */
function Spinner({ retrasoMs = 250 }: { retrasoMs?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), retrasoMs)
    return () => clearTimeout(t)
  }, [retrasoMs])

  // El hueco se reserva igualmente para que al aparecer no salte el layout.
  if (!visible) return <div className="spinner" aria-hidden="true" />

  return (
    // role="status" + aria-live: los lectores de pantalla anuncian la espera
    // sin robar el foco de donde esté el usuario.
    <div className="spinner" role="status" aria-live="polite">
      <div className="spinner__blocks" aria-hidden="true">
        <span className="spinner__block" />
        <span className="spinner__block" />
        <span className="spinner__block" />
      </div>

      <p className="spinner__texto">Cargando</p>
    </div>
  )
}

export default Spinner
