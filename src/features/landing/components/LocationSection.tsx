import {
  ADDRESS,
  ADDRESS_EXTRA,
  LOCALITY,
  MAPS_DIRECTIONS_URL,
  MAPS_EMBED_URL,
  PHONE_HREF,
  PHONE_NUMBER,
  POSTAL_CODE,
  REGION,
} from '../content'
import { Button } from '@/shared/components/ui/Button'
import { SectionHeading } from '@/shared/components/ui/Heading'
import { POSTER_BORDER } from '@/shared/components/ui/tokens'

/** Red mono label heading each detail. */
function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="m-0 mb-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-red-dark">
        {label}
      </p>
      {children}
    </div>
  )
}

/**
 * Location: the venue details on the left, the map on the right.
 *
 * The map is a Google Maps iframe with `loading="lazy"`: it sits at the bottom
 * of the page and must not delay the first paint.
 */
function LocationSection() {
  return (
    <section
      id="donde-estamos"
      className="pt-18 pb-16 scroll-mt-6 max-[900px]:pt-13 max-[900px]:pb-10"
    >
      <SectionHeading tag="Dónde estamos" title="Ubicación" />

      <div className="grid grid-cols-[0.85fr_1.4fr] gap-11 items-start max-[900px]:grid-cols-1">
        <div className="flex flex-col gap-6.5">
          <Detail label="Dirección">
            <p className="m-0 leading-[1.6] text-ink-soft">{ADDRESS}</p>
            <p className="m-0 leading-[1.6] text-ink-soft">{ADDRESS_EXTRA}</p>
            <p className="m-0 leading-[1.6] text-ink-soft">
              {LOCALITY}, {POSTAL_CODE} · {REGION}
            </p>
          </Detail>

          <Detail label="Teléfono">
            <p className="m-0 leading-[1.6]">
              {/* The phone number is treated as a headline: it is the main action */}
              <a
                href={PHONE_HREF}
                className="font-title text-[2.125rem] tracking-[0.03em] text-ink
                  border-b-[3px] border-red transition-colors hover:text-red
                  max-[560px]:text-[1.875rem]"
              >
                {PHONE_NUMBER}
              </a>
            </p>
          </Detail>

          <Detail label="Cómo funciona">
            <p className="m-0 leading-[1.6] text-ink-soft">
              Comida para llevar y recogida en tienda
            </p>
            <p className="m-0 leading-[1.6] text-ink-mute">Lunes cerrado</p>
          </Detail>

          <Button
            variant="red"
            href={MAPS_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start mt-2 max-[560px]:self-stretch"
          >
            Cómo llegar →
          </Button>
        </div>

        <div
          className={`relative aspect-[4/3] overflow-hidden ${POSTER_BORDER}
            shadow-[12px_12px_0_var(--color-ink)] bg-cream max-[900px]:aspect-[3/2]`}
        >
          <iframe
            title="Mapa · Asador El Casar"
            src={MAPS_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="w-full h-full border-0 block saturate-85"
          />
          {/* Small ink sign over the map. pointer-events-none so it does not
              steal the drag gesture from the iframe. */}
          <span
            className="absolute left-3.5 bottom-3.5 px-3 py-2 bg-ink text-bg
              font-mono text-xs font-bold uppercase tracking-[0.12em] pointer-events-none"
          >
            Mapa · {ADDRESS}
          </span>
        </div>
      </div>
    </section>
  )
}

export default LocationSection
