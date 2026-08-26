import { HORARIO } from '../lib/datos'
import { BLOQUE, CabeceraSeccion } from './ui'

/**
 * Horario semanal.
 *
 * La retícula tiene ocho celdas: el lunes cerrado, los seis días de apertura
 * y el reclamo del menú de los viernes. Lunes y el reclamo van escritos
 * aparte porque no son un día con franjas: uno es un estado y el otro un
 * enlace.
 */

const CELDA = `flex flex-col gap-2.5 px-4.5 pt-4.5 pb-5 ${BLOQUE}`
const NOMBRE_DIA = 'm-0 font-title text-[1.625rem] tracking-[0.03em] uppercase leading-tight'

/** Un día con sus franjas horarias. */
function Dia({ dia, franjas }: { dia: string; franjas: { etiqueta: string; horas: string }[] }) {
  return (
    <div className={`${CELDA} bg-card`}>
      <p className={`${NOMBRE_DIA} text-ink`}>{dia}</p>

      {/* La segunda franja del día se separa con línea fina, no con la gruesa */}
      {franjas.map((f, i) => (
        <p
          key={f.etiqueta}
          className={`flex items-baseline justify-between gap-2.5 m-0 pt-2.5
            font-mono text-sm text-ink-soft tabular-nums
            ${i === 0 ? 'border-t-2 border-ink' : 'border-t-[1.5px] border-line'}`}
        >
          <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-mute">
            {f.etiqueta}
          </span>
          {f.horas}
        </p>
      ))}
    </div>
  )
}

function Schedule() {
  return (
    <section id="horario" className="pt-18 scroll-mt-6 max-[900px]:pt-13">
      <CabeceraSeccion etiqueta="Cuándo abrimos" titulo="Horario" />

      <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        {/* Lunes: el único cerrado, en rojo */}
        <div className={`${CELDA} bg-red`}>
          <p className={`${NOMBRE_DIA} text-white`}>Lunes</p>
          <p className="m-0 pt-2.5 border-t-2 border-white/55 font-mono text-sm font-bold uppercase tracking-[0.1em] text-white">
            Cerrado
          </p>
        </div>

        {HORARIO.map((d) => (
          <Dia key={d.dia} dia={d.dia} franjas={d.franjas} />
        ))}

        {/* Celda destacada: el menú de los viernes, que lleva a reservas */}
        <a href="#reservas" className={`${CELDA} bg-amber transition-colors hover:bg-amber-dark`}>
          <p className={`${NOMBRE_DIA} text-ink`}>Menú especial</p>
          <p className="m-0 pt-2.5 border-t-2 border-ink text-[0.9375rem] leading-[1.45] text-ink">
            Todos los viernes. Resérvalo el día anterior →
          </p>
        </a>
      </div>
    </section>
  )
}

export default Schedule
