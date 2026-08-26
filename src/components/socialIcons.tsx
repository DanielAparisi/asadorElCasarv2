import { FACEBOOK, INSTAGRAM, TEL_HREF } from '../lib/datos'

/**
 * Los SVG de la web y los enlaces a redes.
 *
 * Son inline y no un paquete de iconos: son cuatro, no cambian nunca, y así
 * heredan el color con `currentColor` sin cargar una dependencia entera.
 *
 * Cada icono es un componente y no una constante JSX exportada: exportar
 * valores que no son componentes desde un archivo que sí los tiene rompe el
 * Fast Refresh de Vite (regla react-refresh/only-export-components).
 */

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 flex-none block">
      {children}
    </svg>
  )
}

export function IconoTelefono() {
  return (
    <Svg>
      <path
        d="M6.3 3.5h2.9l1.5 3.7-2 1.4a11.5 11.5 0 0 0 5.4 5.4l1.4-2 3.7 1.5v2.9a1.6 1.6 0 0 1-1.8 1.6C10.6 19.6 4.4 13.4 4.7 5.3A1.6 1.6 0 0 1 6.3 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function IconoWhatsapp() {
  return (
    <Svg>
      <path
        d="M12.04 2A9.9 9.9 0 0 0 3.6 17.1L2.5 21.5l4.55-1.19A9.9 9.9 0 1 0 12.04 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 7.6c-.2-.45-.4-.46-.6-.47h-.5c-.18 0-.47.07-.71.34-.25.27-.94.92-.94 2.24s.96 2.6 1.1 2.78c.13.18 1.86 2.98 4.6 4.06 2.28.9 2.74.72 3.24.67.5-.04 1.6-.65 1.82-1.29.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.31-.27-.14-1.6-.79-1.84-.88-.25-.09-.43-.13-.61.14-.18.27-.7.87-.85 1.05-.16.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.6-1.5-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.14-.16.18-.27.28-.45.09-.18.04-.34-.02-.48-.07-.13-.6-1.45-.83-1.98Z"
        fill="currentColor"
      />
    </Svg>
  )
}

function IconoInstagram() {
  return (
    <Svg>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </Svg>
  )
}

function IconoFacebook() {
  return (
    <Svg>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M13.4 19.4v-5.9h2l.37-2.3h-2.37V9.7c0-.66.19-1.11 1.14-1.11h1.29V6.53a17 17 0 0 0-1.86-.1c-1.85 0-3.11 1.13-3.11 3.2v1.57H8.84v2.3h2.02v5.9Z"
        fill="currentColor"
      />
    </Svg>
  )
}

/** Fila de iconos circulares del pie. */
export function SocialIcons() {
  const redes = [
    { href: INSTAGRAM, etiqueta: 'Instagram', Icono: IconoInstagram, externo: true },
    { href: FACEBOOK, etiqueta: 'Facebook', Icono: IconoFacebook, externo: true },
    { href: TEL_HREF, etiqueta: 'Llamar por teléfono', Icono: IconoTelefono, externo: false },
  ]

  return (
    <div className="flex gap-3">
      {redes.map(({ href, etiqueta, Icono, externo }) => (
        <a
          key={etiqueta}
          href={href}
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
