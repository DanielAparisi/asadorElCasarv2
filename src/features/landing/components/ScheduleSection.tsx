import { WEEKLY_SCHEDULE, type TimeSlot } from '../content'
import { SectionHeading } from '../../../shared/components/ui/Heading'
import { POSTER_BORDER } from '../../../shared/components/ui/tokens'

/**
 * Weekly opening hours.
 *
 * The grid holds eight cells: Monday closed, the six open days and the Friday
 * set-menu callout. Monday and the callout are written separately because
 * they are not days with time slots: one is a state, the other a link.
 */

const CELL = `flex flex-col gap-2.5 px-4.5 pt-4.5 pb-5 ${POSTER_BORDER}`
const DAY_NAME = 'm-0 font-title text-[1.625rem] tracking-[0.03em] uppercase leading-tight'

/** One open day with its time slots. */
function DayCard({ day, slots }: { day: string; slots: TimeSlot[] }) {
  return (
    <div className={`${CELL} bg-card`}>
      <p className={`${DAY_NAME} text-ink`}>{day}</p>

      {/* The second slot of the day is separated by a hairline, not the thick rule */}
      {slots.map((slot, index) => (
        <p
          key={slot.label}
          className={`flex items-baseline justify-between gap-2.5 m-0 pt-2.5
            font-mono text-sm text-ink-soft tabular-nums
            ${index === 0 ? 'border-t-2 border-ink' : 'border-t-[1.5px] border-line'}`}
        >
          <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-mute">
            {slot.label}
          </span>
          {slot.hours}
        </p>
      ))}
    </div>
  )
}

function ScheduleSection() {
  return (
    <section id="horario" className="pt-18 scroll-mt-6 max-[900px]:pt-13">
      <SectionHeading tag="Cuándo abrimos" title="Horario" />

      <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        {/* Monday: the only closed day, in red */}
        <div className={`${CELL} bg-red`}>
          <p className={`${DAY_NAME} text-white`}>Lunes</p>
          <p className="m-0 pt-2.5 border-t-2 border-white/55 font-mono text-sm font-bold uppercase tracking-[0.1em] text-white">
            Cerrado
          </p>
        </div>

        {WEEKLY_SCHEDULE.map((entry) => (
          <DayCard key={entry.day} day={entry.day} slots={entry.slots} />
        ))}

        {/* Highlighted cell: the Friday set menu, linking to the order section */}
        <a href="#reservas" className={`${CELL} bg-amber transition-colors hover:bg-amber-dark`}>
          <p className={`${DAY_NAME} text-ink`}>Menú especial</p>
          <p className="m-0 pt-2.5 border-t-2 border-ink text-[0.9375rem] leading-[1.45] text-ink">
            Todos los viernes. Resérvalo el día anterior →
          </p>
        </a>
      </div>
    </section>
  )
}

export default ScheduleSection
