import { SECCIONES, TELEFONO, TEL_HREF } from '../lib/datos'
import { Marca, PAGE } from './ui'
import IconoTelefono from './icon/telefono'

/**
 * Cabecera: banda de tinta a todo el ancho con la marca, el menú y el
 * teléfono siempre a la vista.
 *
 * Por debajo de 900px la navegación pasa a una tercera fila centrada
 * (`order-3` + `w-full`) en lugar de comprimirse contra el logo.
 */
function Header() {
  return (
    <header className="bg-ink">
      <div
        className={`${PAGE} flex items-center justify-between gap-8 flex-wrap py-3.5
          max-[900px]:justify-center max-[900px]:text-center max-[900px]:gap-4`}
      >
        <Marca />

        <nav
          className="flex items-center gap-6.5 flex-wrap font-mono text-[0.8125rem] font-bold
            uppercase tracking-[0.12em]
            max-[900px]:order-3 max-[900px]:w-full max-[900px]:justify-center max-[900px]:gap-4.5"
        >
          {SECCIONES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="text-bg pb-[3px] border-b-2 border-transparent transition-colors
                hover:text-white hover:border-red"
            >
              {s.texto}
            </a>
          ))}
        </nav>

        <a
          href={TEL_HREF}
          className="inline-flex items-center gap-2.5 px-4.5 py-2.75 rounded-[2px]
            bg-red text-white transition-colors hover:bg-red-dark"
        >
          <IconoTelefono />
          <span className="font-title text-[1.1875rem] tracking-[0.05em]">{TELEFONO}</span>
        </a>
      </div>
    </header>
  )
}

export default Header
