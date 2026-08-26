import { HORARIO, PASOS, RECLAMOS, TELEFONO, TEL_HREF, WHATSAPP } from '../lib/datos'
import { formatearPrecio, useCarta } from '../hooks/useCarta'
import {
  BLOQUE,
  BOTON_SOBRE_TINTA,
  Boton,
  CabeceraSeccion,
  Entradilla,
  Etiqueta,
  Foto,
  PAGE,
  Titular,
} from '../components/ui'
import Header from '../components/header'
import Footer from '../components/footer'
import UbicationSection from '../components/ubicationSection'

/* ============================================================
   Carta pública — conversión del diseño de
   github.com/DanielAparisi/asadorElCasar (index.html + styles.css).

   Sobre los breakpoints: el diseño original es desktop-first, con cortes en
   900px y 560px. Se conservan tal cual con `max-[900px]:` y `max-[560px]:`
   en lugar de reescribirlo mobile-first: así el resultado es comparable
   línea a línea con el CSS de origen y no hace falta tocar los breakpoints
   por defecto de Tailwind, que usa el panel de admin.
   ============================================================ */

/** Una celda del horario. */
function Dia({
  dia,
  franjas,
}: {
  dia: string
  franjas: { etiqueta: string; horas: string }[]
}) {
  return (
    <div className={`flex flex-col gap-2.5 px-4.5 pt-4.5 pb-5 ${BLOQUE} bg-card`}>
      <p className="m-0 font-title text-[1.625rem] tracking-[0.03em] uppercase leading-tight text-ink">
        {dia}
      </p>
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

function Home() {
  const { platos } = useCarta()

  return (
    <>
      <Header />

      {/* ============ Hero ============ */}
      <div className={PAGE}>
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
              {/* Palabra recortada en blanco sobre bloque rojo, algo torcida */}
              <span className="inline-block bg-red text-bg px-3.5 pb-2 -rotate-[1.2deg] max-[560px]:px-2 max-[560px]:pb-1">
                brasa
              </span>
              ,<br />
              como toda la vida
            </h1>

            <Entradilla>
              Asador de pollos y comida para llevar en El Casar. Recetas caseras y productos de
              primera calidad, para comer en familia o llevar a casa.
            </Entradilla>

            <div className="flex gap-4.5 flex-wrap mt-1.5">
              <Boton variante="red" href="#la-carta">
                Ver la carta
              </Boton>
              <Boton variante="paper" href="#donde-estamos">
                Cómo llegar
              </Boton>
            </div>
          </div>

          <div className="relative max-[900px]:mr-2.5">
            <Foto className="aspect-[4/5] shadow-[12px_12px_0_var(--color-ink)] max-[900px]:aspect-[3/2]">
              foto · pollo a la brasa
            </Foto>

            {/* Chapa ámbar con el teléfono, pegada a la esquina de la foto */}
            <a
              href={TEL_HREF}
              className={`absolute -top-6.5 -right-5.5 flex flex-col items-center justify-center gap-0.5
                w-[132px] h-[132px] rounded-full bg-amber ${BLOQUE} text-ink
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

      {/* ============ Banda roja ============ */}
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
        {/* ============ Carta + Nosotros ============ */}
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

          <div id="nosotros">
            <Etiqueta>La casa</Etiqueta>
            <Titular className="mt-5 mb-6 text-[3.75rem] leading-[0.94] max-[900px]:text-[2.75rem] max-[560px]:text-[2.375rem]">
              Sobre nosotros
            </Titular>

            <Entradilla>
              Un asador familiar de barrio donde la parrilla no se apaga. Recetas caseras y
              productos de primera calidad, con el trato de toda la vida. Reservas, recogida en
              tienda y comida para llevar.
            </Entradilla>

            <div className={`flex flex-col gap-1.5 mt-7 px-6 py-5.5 bg-amber ${BLOQUE} -rotate-[0.8deg]`}>
              <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-ink">
                La parrilla no se apaga
              </span>
              <span className="font-title text-[2.5rem] leading-none uppercase text-ink max-[560px]:text-[1.75rem]">
                De martes a domingo
              </span>
            </div>
          </div>
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

        {/* ============ Horario ============ */}
        <section id="horario" className="pt-18 scroll-mt-6 max-[900px]:pt-13">
          <CabeceraSeccion etiqueta="Cuándo abrimos" titulo="Horario" />

          <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
            {/* Lunes va aparte: es el único cerrado y se pinta en rojo */}
            <div className={`flex flex-col gap-2.5 px-4.5 pt-4.5 pb-5 ${BLOQUE} bg-red`}>
              <p className="m-0 font-title text-[1.625rem] tracking-[0.03em] uppercase leading-tight text-white">
                Lunes
              </p>
              <p className="m-0 pt-2.5 border-t-2 border-white/55 font-mono text-sm font-bold uppercase tracking-[0.1em] text-white">
                Cerrado
              </p>
            </div>

            {HORARIO.map((d) => (
              <Dia key={d.dia} dia={d.dia} franjas={d.franjas} />
            ))}

            {/* Celda destacada: el menú de los viernes */}
            <a
              href="#reservas"
              className={`flex flex-col gap-2.5 px-4.5 pt-4.5 pb-5 ${BLOQUE} bg-amber
                transition-colors hover:bg-amber-dark`}
            >
              <p className="m-0 font-title text-[1.625rem] tracking-[0.03em] uppercase leading-tight text-ink">
                Menú especial
              </p>
              <p className="m-0 pt-2.5 border-t-2 border-ink text-[0.9375rem] leading-[1.45] text-ink">
                Todos los viernes. Resérvalo el día anterior →
              </p>
            </a>
          </div>
        </section>

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
