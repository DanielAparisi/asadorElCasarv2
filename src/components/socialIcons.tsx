import { FACEBOOK, INSTAGRAM, TEL_HREF } from '../lib/datos'
import IconoInstagram from './icon/instagram'
import IconoFacebook from './icon/facebook'
import IconoTelefono from './icon/telefono'


const REDES = [
  { href: INSTAGRAM, etiqueta: 'Instagram', Icono: IconoInstagram, externo: true },
  { href: FACEBOOK, etiqueta: 'Facebook', Icono: IconoFacebook, externo: true },
  // El teléfono no es una red, pero comparte el mismo botón redondo.
  { href: TEL_HREF, etiqueta: 'Llamar por teléfono', Icono: IconoTelefono, externo: false },
]

export function SocialIcons() {
  return (
    <div className="flex gap-3">
      {REDES.map(({ href, etiqueta, Icono, externo }) => (
        <a
          key={etiqueta}
          href={href}
          // El enlace lleva el nombre accesible porque el icono es decorativo.
          aria-label={etiqueta}
          {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-flex items-center justify-center w-[46px] h-[46px] rounded-full
            border-2 border-line-dark text-bg transition-colors hover:bg-red hover:border-red"
        >
          <Icono />
        </a>
      ))}
    </div>
  )
}
