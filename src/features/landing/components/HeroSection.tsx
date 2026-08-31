import { PHONE_HREF } from '../content'
import { Button } from '../../../shared/components/ui/Button'
import { Lead } from '../../../shared/components/ui/Lead'
import { PhotoFrame } from '../../../shared/components/ui/PhotoFrame'
import { PAGE_CONTAINER, POSTER_BORDER } from '../../../shared/components/ui/tokens'

/**
 * The first thing visitors see: headline, lead, the two buttons and the big
 * photo with the phone badge on top.
 *
 * This is the only section with an `h1`; the rest of the page uses `h2`. More
 * than one `h1` breaks the heading outline for screen readers and search
 * engines.
 */
function HeroSection() {
  return (
    <div className={PAGE_CONTAINER}>
      <section
        className="grid grid-cols-[1.25fr_1fr] gap-12 items-center pt-[3.875rem] pb-14
          max-[900px]:grid-cols-1 max-[900px]:gap-10 max-[900px]:pt-10 max-[900px]:pb-12"
      >
        <div className="flex flex-col gap-6.5">
          <p className="font-mono text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-red-dark">
            Asador de pollos · Comida para llevar
          </p>

          <h1
            className="m-0 font-title font-normal uppercase text-ink
              text-[6.5rem] leading-[0.88] tracking-[0.005em]
              max-[900px]:text-[3.5rem] max-[560px]:text-[2.875rem]"
          >
            Pollo a la{' '}
            {/* Word knocked out in white on a red block, slightly tilted */}
            <span className="inline-block bg-red text-bg px-3.5 pb-2 -rotate-[1.2deg] max-[560px]:px-2 max-[560px]:pb-1">
              brasa
            </span>
            ,<br />
            como toda la vida
          </h1>

          <Lead>
            Asador de pollos y comida para llevar en El Casar. Recetas caseras y productos de
            primera calidad, para comer en familia o llevar a casa.
          </Lead>

          <div className="flex gap-4.5 flex-wrap mt-1.5">
            <Button variant="red" href="#la-carta">
              Ver la carta
            </Button>
            <Button variant="paper" href="#donde-estamos">
              Cómo llegar
            </Button>
          </div>
        </div>

        <div className="relative max-[900px]:mr-2.5">
          <PhotoFrame className="aspect-[4/5] shadow-[12px_12px_0_var(--color-ink)] max-[900px]:aspect-[3/2]">
            foto · pollo a la brasa
          </PhotoFrame>

          {/* Amber badge with the phone number, stuck to the photo corner */}
          <a
            href={PHONE_HREF}
            className={`absolute -top-6.5 -right-5.5 flex flex-col items-center justify-center gap-0.5
              w-[132px] h-[132px] rounded-full bg-amber ${POSTER_BORDER} text-ink
              -rotate-9 transition-transform hover:scale-104
              max-[900px]:-top-5 max-[900px]:-right-3.5 max-[900px]:w-[104px] max-[900px]:h-[104px]`}
          >
            <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em]">
              Pide ya
            </span>
            <span className="font-title text-[1.5625rem] leading-none max-[900px]:text-xl">
              650 71
            </span>
            <span className="font-title text-[1.5625rem] leading-none max-[900px]:text-xl">
              13 95
            </span>
          </a>
        </div>
      </section>
    </div>
  )
}

export default HeroSection
