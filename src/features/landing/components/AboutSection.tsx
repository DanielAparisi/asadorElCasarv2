import { Heading } from '../../../shared/components/ui/Heading'
import { Lead } from '../../../shared/components/ui/Lead'
import { Tag } from '../../../shared/components/ui/Tag'
import { POSTER_BORDER } from '../../../shared/components/ui/tokens'

/**
 * "About us": the block that opens the page under the marquee band.
 *
 * It brings neither the grid nor the width: whoever places it decides that,
 * which is what lets the page be reordered without touching the section.
 */
function AboutSection() {
  return (
    <div id="nosotros">
      <Tag>La casa</Tag>
      <Heading className="mt-5 mb-6 text-[3.75rem] leading-[0.94] max-[900px]:text-[2.75rem] max-[560px]:text-[2.375rem]">
        Sobre nosotros
      </Heading>

      <Lead>
        Un asador familiar de barrio donde la parrilla no se apaga. Recetas caseras y productos de
        primera calidad, con el trato de toda la vida. Reservas, recogida en tienda y comida para
        llevar.
      </Lead>

      {/* Amber reinforcement block, tilted like a hand-stuck poster */}
      <div
        className={`flex flex-col gap-1.5 mt-7 px-6 py-5.5 bg-amber ${POSTER_BORDER} -rotate-[0.8deg]`}
      >
        <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-ink">
          La parrilla no se apaga
        </span>
        <span className="font-title text-[2.5rem] leading-none uppercase text-ink max-[560px]:text-[1.75rem]">
          De martes a domingo
        </span>
      </div>
    </div>
  )
}

export default AboutSection
