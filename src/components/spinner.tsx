import { useEffect, useState } from 'react'

/**
 * Indicador de carga a pantalla completa, en la dirección visual de la casa:
 * bloques planos con borde grueso y sombra dura.
 *
 * Espera `retrasoMs` antes de aparecer. Leer la sesión de localStorage suele
 * tardar milisegundos, y un spinner que aparece y desaparece en 50 ms se ve
 * como un parpadeo: molesta más que un instante en blanco. Si la carga es
 * rápida, aquí no se llega a ver nada.
 */

const PANTALLA = 'min-h-svh flex flex-col items-center justify-center gap-7 bg-bg'

const BLOQUE = `w-7 h-7 border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)]
  animate-salto motion-reduce:animate-latido`

// El desfase de cada bloque es lo que crea la cascada. Va como valor
// arbitrario porque es un dato de este componente, no del tema.
const BLOQUES = [
  { color: 'bg-red', retraso: '[animation-delay:0ms]' },
  { color: 'bg-amber', retraso: '[animation-delay:140ms]' },
  { color: 'bg-card', retraso: '[animation-delay:280ms]' },
]

function Spinner({ retrasoMs = 250 }: { retrasoMs?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), retrasoMs)
    return () => clearTimeout(t)
  }, [retrasoMs])

  // El hueco se reserva igualmente para que al aparecer no salte el layout.
  if (!visible) return <div className={PANTALLA} aria-hidden="true" />

  return (
    // role="status" + aria-live: los lectores de pantalla anuncian la espera
    // sin robar el foco de donde esté el usuario.
    <div className={PANTALLA} role="status" aria-live="polite">
      {/* py-3 reserva el recorrido del salto: sin él, el conjunto cambia de
          alto cuando los bloques suben. */}
      <div className="flex gap-3.5 py-3" aria-hidden="true">
        {BLOQUES.map((b) => (
          <span key={b.color} className={`${BLOQUE} ${b.color} ${b.retraso}`} />
        ))}
      </div>

      <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.22em] text-ink-mute">
        Cargando
      </p>
    </div>
  )
}

export default Spinner
