import { DIRECCION, SECCIONES, TELEFONO, WHATSAPP } from '../lib/datos'
import { BOTON_SOBRE_TINTA, Boton, Marca, PAGE } from './ui'
import { SocialIcons } from './socialIcons'
import IconoWhatsapp from './icon/whatsapp'

/**
 * Pie: marca, menú repetido, contacto y aviso legal.
 *
 * Repetir la navegación aquí es deliberado: quien llega al final de la página
 * no debería tener que volver arriba para seguir navegando.
 */
function Footer() {
  return (
    <footer className="bg-ink border-t-[3px] border-red">
      <div className={`${PAGE} pt-12 pb-6.5`}>
        <div
          className="grid grid-cols-[1.2fr_1fr_auto] gap-12 items-start pb-8.5
            max-[900px]:grid-cols-1 max-[900px]:gap-8"
        >
          <div>
            <Marca pie />
            <p className="mt-4 max-w-[22rem] text-[0.9375rem] leading-[1.6] text-on-dark-mute">
              Pollo a la brasa y comida para llevar en El Casar.
            </p>
          </div>

          {/* En estrecho el menú pasa a una fila con scroll horizontal en vez
              de estirar el pie a lo alto. */}
          <nav
            className="grid gap-2.5 justify-items-start font-mono text-[0.8125rem] font-bold
              uppercase tracking-[0.12em]
              max-[900px]:grid-flow-col max-[900px]:auto-cols-max max-[900px]:gap-5
              max-[900px]:overflow-x-auto"
          >
            {SECCIONES.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="text-bg pb-0.5 border-b-2 border-transparent transition-colors hover:border-red"
              >
                {s.texto}
              </a>
            ))}
          </nav>

          <div className="flex flex-col items-end gap-4.5 max-[900px]:items-start">
            <Boton
              variante="red"
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className={`gap-2.75 px-5.5 py-3.5 text-base tracking-[0.03em] ${BOTON_SOBRE_TINTA}`}
            >
              <IconoWhatsapp />
              WhatsApp · {TELEFONO}
            </Boton>

            <SocialIcons />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap pt-5.5 border-t-2 border-line-dark">
          <p className="m-0 font-mono text-xs tracking-[0.05em] text-ink-mute">
            © 2026 Asador El Casar · Comida para llevar
          </p>
          <p className="m-0 font-mono text-xs tracking-[0.05em] text-ink-mute">
            {DIRECCION} · El Casar, 19170
          </p>
        </div>

        <div className="flex justify-center pt-4.5">
          <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white">
            Desarrollado por Daniel Aparisi
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
