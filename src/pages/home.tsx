import { PASOS, RECLAMOS, TELEFONO, TEL_HREF, WHATSAPP } from '../lib/datos'
import { formatearPrecio, useCarta } from '../hooks/useCarta'
import {
  BOTON_SOBRE_TINTA,
  Boton,
  Entradilla,
  Etiqueta,
  Foto,
  PAGE,
  Titular,
} from '../components/ui'
import Header from '../components/header'
import MainBanner from '../components/mainbanner'
import About from '../components/about'
import Schedule from '../components/schedule'
import UbicationSection from '../components/ubicationSection'
import Footer from '../components/footer'

/* ============================================================
   Carta pública — conversión del diseño de
   github.com/DanielAparisi/asadorElCasar (index.html + styles.css).

   Este archivo es el montaje: qué secciones hay y en qué orden. El contenido
   de cada una vive en components/.

   Sobre los breakpoints: el diseño original es desktop-first, con cortes en
   900px y 560px. Se conservan tal cual con `max-[900px]:` y `max-[560px]:`
   para poder compararlo línea a línea con el CSS de origen y no tocar los
   breakpoints por defecto de Tailwind, que usa el panel de admin.
   ============================================================ */

function Home() {
  const { platos } = useCarta()

  return (
    <>
      <Header />
      <MainBanner />

      {/* ============ Banda roja ============
          Decorativa: los mismos reclamos ya salen como texto real en el resto
          de la página, así que se oculta a los lectores de pantalla. */}
      <div
        className="flex items-center gap-5 overflow-hidden px-6 py-3.25 bg-red
          border-y-[3px] border-ink font-mono text-[0.8125rem] font-bold uppercase
          tracking-[0.2em] text-white whitespace-nowrap
          max-[900px]:gap-3.5 max-[900px]:text-xs max-[900px]:tracking-[0.16em]"
        aria-hidden="true"
      >
        {RECLAMOS.map((reclamo, i) => (
          <span key={i} className="contents">
            <span>{reclamo}</span>
            {i < RECLAMOS.length - 1 && <span className="opacity-75">◆</span>}
          </span>
        ))}
      </div>

      <div className={PAGE}>
        {/* ============ Carta + Sobre nosotros ============ */}
        <section className="grid grid-cols-[1.15fr_1fr] gap-14 pt-16 max-[900px]:grid-cols-1 max-[900px]:gap-11 max-[900px]:pt-12">
          <div id="la-carta" className="scroll-mt-6">
            <Etiqueta>La carta</Etiqueta>
            <Titular className="mt-5 mb-6 text-[3.75rem] leading-[0.94] max-[900px]:text-[2.75rem] max-[560px]:text-[2.375rem]">
              Nuestros clásicos
            </Titular>

            <ul className="m-0 p-0 list-none border-t-[3px] border-ink">
              {platos.map((plato) => (
                <li
                  key={plato.id}
                  className="flex items-baseline justify-between gap-4.5 px-1 py-3.75
                    border-b-[1.5px] border-ink last:border-b-[3px]"
                >
                  <span className="font-title text-[1.75rem] tracking-[0.02em] uppercase text-ink max-[560px]:text-[1.375rem]">
                    {plato.nombre}
                  </span>
                  <span className="font-title text-[1.75rem] tracking-[0.02em] uppercase text-red whitespace-nowrap max-[560px]:text-[1.375rem]">
                    {formatearPrecio(plato.precio_centimos)}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 font-mono text-xs tracking-[0.04em] text-ink-mute">
              Precios de ejemplo — sustituir por los reales.
            </p>
          </div>

          <About />
        </section>

        {/* ============ Galería ============ */}
        <section id="fotos" className="pt-14.5 scroll-mt-6 max-[900px]:pt-11">
          <Etiqueta rojo>La brasa</Etiqueta>
          {/* Rotaciones distintas para que la retícula no quede rígida */}
          <div className="grid grid-cols-3 gap-6.5 mt-5 max-[900px]:grid-cols-2 max-[900px]:gap-5 max-[560px]:grid-cols-1">
            <Foto className="aspect-square -rotate-[1.1deg] max-[560px]:aspect-[3/2]">
              foto · parrilla
            </Foto>
            <Foto className="aspect-square rotate-[0.7deg] max-[560px]:aspect-[3/2]">
              foto · pollos
            </Foto>
            <Foto className="aspect-square -rotate-[0.5deg] max-[900px]:col-span-2 max-[900px]:aspect-video max-[560px]:col-span-1 max-[560px]:aspect-[3/2]">
              foto · mesa
            </Foto>
          </div>
        </section>

        <Schedule />

        {/* ============ Reservas y pedidos (bloque de tinta) ============ */}
        <section
          id="reservas"
          className="grid grid-cols-2 gap-14 items-center mt-18 px-11.5 py-13 bg-ink scroll-mt-6
            max-[900px]:grid-cols-1 max-[900px]:mt-13 max-[900px]:px-7 max-[900px]:py-9"
        >
          <div className="flex flex-col gap-5">
            <div>
              <Etiqueta rojo>Reservas y pedidos</Etiqueta>
            </div>

            <h2 className="m-0 font-title font-normal uppercase tracking-[0.01em] text-bg text-[4.25rem] leading-[0.9] max-[900px]:text-[2.75rem] max-[560px]:text-[2.375rem]">
              Encarga tu pollo
            </h2>

            <Entradilla invertido>
              Haz tu pedido por WhatsApp o por teléfono y te decimos la hora de recogida. Para
              fines de semana y festivos, mejor con un día de antelación: la parrilla se llena
              pronto.
            </Entradilla>

            <div className="flex gap-4 flex-wrap mt-2">
              <Boton
                variante="red"
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className={BOTON_SOBRE_TINTA}
              >
                Pedir por WhatsApp
              </Boton>
              <Boton variante="ghost" href={TEL_HREF}>
                Llamar · {TELEFONO}
              </Boton>
            </div>
          </div>

          <ol className="m-0 p-0 list-none grid gap-5">
            {PASOS.map((paso, i) => (
              <li
                key={paso.num}
                className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1 items-baseline
                  ${i < PASOS.length - 1 ? 'pb-5 border-b-2 border-line-dark' : ''}`}
              >
                <span className="row-span-2 font-title text-[2.875rem] leading-[0.9] text-red">
                  {paso.num}
                </span>
                <p className="m-0 font-title text-[1.375rem] tracking-[0.03em] uppercase text-bg">
                  {paso.titulo}
                </p>
                <p className="m-0 text-[0.9375rem] leading-[1.6] text-on-dark">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <UbicationSection />
      </div>

      <Footer />
    </>
  )
}

export default Home
