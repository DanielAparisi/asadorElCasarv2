import { DIRECCION, MAPS_EMBED, MAPS_URL, TELEFONO, TEL_HREF } from '../lib/datos'
import { BLOQUE, Boton, CabeceraSeccion } from './ui'

/** Etiqueta roja en mono que encabeza cada dato. */
function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="m-0 mb-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-red-dark">
        {etiqueta}
      </p>
      {children}
    </div>
  )
}

/**
 * Ubicación: los datos del local a la izquierda y el mapa a la derecha.
 *
 * El mapa es un iframe de Google Maps con `loading="lazy"`: está al final de
 * la página y no debe retrasar la primera pintada.
 */
function UbicationSection() {
  return (
    <section
      id="donde-estamos"
      className="pt-18 pb-16 scroll-mt-6 max-[900px]:pt-13 max-[900px]:pb-10"
    >
      <CabeceraSeccion etiqueta="Dónde estamos" titulo="Ubicación" />

      <div className="grid grid-cols-[0.85fr_1.4fr] gap-11 items-start max-[900px]:grid-cols-1">
        <div className="flex flex-col gap-6.5">
          <Dato etiqueta="Dirección">
            <p className="m-0 leading-[1.6] text-ink-soft">{DIRECCION}</p>
            <p className="m-0 leading-[1.6] text-ink-soft">1.º piso, local 10</p>
            <p className="m-0 leading-[1.6] text-ink-soft">El Casar, 19170 · Guadalajara</p>
          </Dato>

          <Dato etiqueta="Teléfono">
            <p className="m-0 leading-[1.6]">
              {/* El teléfono se trata como titular: es la acción principal */}
              <a
                href={TEL_HREF}
                className="font-title text-[2.125rem] tracking-[0.03em] text-ink
                  border-b-[3px] border-red transition-colors hover:text-red
                  max-[560px]:text-[1.875rem]"
              >
                {TELEFONO}
              </a>
            </p>
          </Dato>

          <Dato etiqueta="Cómo funciona">
            <p className="m-0 leading-[1.6] text-ink-soft">
              Comida para llevar y recogida en tienda
            </p>
            <p className="m-0 leading-[1.6] text-ink-mute">Lunes cerrado</p>
          </Dato>

          <Boton
            variante="red"
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start mt-2 max-[560px]:self-stretch"
          >
            Cómo llegar →
          </Boton>
        </div>

        <div
          className={`relative aspect-[4/3] overflow-hidden ${BLOQUE}
            shadow-[12px_12px_0_var(--color-ink)] bg-cream max-[900px]:aspect-[3/2]`}
        >
          <iframe
            title="Mapa · Asador El Casar"
            src={MAPS_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="w-full h-full border-0 block saturate-85"
          />
          {/* Cartelito de tinta sobre el mapa. pointer-events-none para no
              robarle el arrastre al iframe. */}
          <span
            className="absolute left-3.5 bottom-3.5 px-3 py-2 bg-ink text-bg
              font-mono text-xs font-bold uppercase tracking-[0.12em] pointer-events-none"
          >
            Mapa · {DIRECCION}
          </span>
        </div>
      </div>
    </section>
  )
}

export default UbicationSection
