import { TEL_HREF } from '../lib/datos'
import { BLOQUE, Boton, Entradilla, Foto, PAGE } from './ui'

/**
 * Lo primero que se ve: el titular, la entradilla, los dos botones y la foto
 * grande con la chapa del teléfono encima.
 *
 * Es la única sección con un `h1`: el resto de la página usa `h2`. Tener más
 * de un `h1` rompe el esquema de encabezados para lectores de pantalla y para
 * los buscadores.
 */
function MainBanner() {
  return (
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
  )
}

export default MainBanner
