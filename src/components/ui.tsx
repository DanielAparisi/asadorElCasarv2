import logo from '../assets/logo.jpg'

/**
 * Las piezas del lenguaje visual del asador: bloques planos, borde grueso y
 * sombra dura.
 *
 * En el CSS original eran clases (.btn, .tag, .photo…). En Tailwind esas
 * cadenas son largas y se repiten en cinco archivos, así que pasan a ser
 * componentes: un único sitio donde tocarlas.
 */

/** Borde y sombra del "cartel": la base de casi todo el diseño. */
export const BLOQUE = 'border-[3px] border-ink'
export const SOMBRA = 'shadow-[7px_7px_0_var(--color-ink)]'

/** Ancho del contenido. Las bandas a todo el ancho quedan fuera. */
export const PAGE = 'max-w-[1120px] mx-auto px-6'

type Variante = 'red' | 'paper' | 'ghost'

export function Boton({
  variante,
  href,
  className = '',
  children,
  ...props
}: { variante: Variante; href: string; className?: string; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>) {
  const base = `inline-flex items-center justify-center px-6.5 py-4 rounded-[2px] ${BLOQUE}
    text-[1.0625rem] font-bold uppercase tracking-[0.04em] leading-tight whitespace-nowrap
    transition-[transform,box-shadow,background-color,color] duration-150
    max-[560px]:w-full max-[560px]:whitespace-normal max-[560px]:text-center`

  // Al pulsar, el bloque "cae" sobre su sombra.
  const conSombra = `${SOMBRA} active:translate-x-1 active:translate-y-1
    active:shadow-[3px_3px_0_var(--color-ink)]`

  const variantes: Record<Variante, string> = {
    red: `bg-red text-white hover:bg-red-dark ${conSombra}`,
    paper: `bg-bg text-ink hover:bg-ink hover:text-bg ${conSombra}`,
    // Sobre fondo oscuro el borde pasa a claro y desaparece la sombra: una
    // sombra negra sobre negro no se ve.
    ghost: 'bg-transparent text-bg border-bg hover:bg-bg hover:text-ink',
  }

  return (
    <a href={href} className={`${base} ${variantes[variante]} ${className}`} {...props}>
      {children}
    </a>
  )
}

/** Variante del botón para fondos de tinta: sin sombra y con borde claro. */
export const BOTON_SOBRE_TINTA =
  'border-bg shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none'

export function Etiqueta({
  rojo = false,
  children,
}: {
  rojo?: boolean
  children: React.ReactNode
}) {
  return (
    <p
      className={`inline-block px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] leading-snug
        ${rojo ? 'bg-red text-white' : 'bg-ink text-bg'}`}
    >
      {children}
    </p>
  )
}

/** Hueco de foto: trama diagonal dentro de un marco con sombra dura. */
export function Foto({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative flex items-center justify-center ${BLOQUE}
        shadow-[9px_9px_0_var(--color-ink)]
        bg-[repeating-linear-gradient(45deg,var(--color-cream)_0_12px,var(--color-cream-alt)_12px_24px)]
        ${className}`}
    >
      <span className="font-mono text-sm tracking-[0.02em] text-ink-mute">{children}</span>
    </div>
  )
}

export function Titular({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <h2 className={`m-0 font-title font-normal uppercase text-ink tracking-[0.01em] ${className}`}>
      {children}
    </h2>
  )
}

/** Cabecera de sección centrada: etiqueta encima del titular grande. */
export function CabeceraSeccion({ etiqueta, titulo }: { etiqueta: string; titulo: string }) {
  return (
    <div className="flex flex-col items-center mb-8.5 max-[900px]:mb-7">
      <Etiqueta>{etiqueta}</Etiqueta>
      <Titular className="mt-3.5 text-[5.5rem] leading-[0.92] tracking-[0.02em] max-[900px]:text-[3.5rem] max-[560px]:text-[3rem]">
        {titulo}
      </Titular>
    </div>
  )
}

/** Párrafo de entrada. `invertido` para cuando va sobre tinta. */
export function Entradilla({
  invertido = false,
  children,
}: {
  invertido?: boolean
  children: React.ReactNode
}) {
  return (
    <p
      className={`m-0 max-w-[30rem] leading-[1.7] text-pretty max-[900px]:max-w-none
        ${invertido ? 'text-on-dark' : 'text-ink-soft'}`}
    >
      {children}
    </p>
  )
}

/** Logo + nombre. Aparece en la cabecera y, algo más pequeño, en el pie. */
export function Marca({ pie = false }: { pie?: boolean }) {
  return (
    <a href="#" className="flex items-center gap-3.5">
      <img
        src={logo}
        alt="Logo Asador El Casar"
        className={`rounded-full border-2 border-red object-cover
          ${pie ? 'w-[46px] h-[46px]' : 'w-[52px] h-[52px]'}`}
      />
      <span
        className={`font-title uppercase tracking-[0.03em] text-bg
          ${pie ? 'text-[1.3125rem]' : 'text-2xl max-[560px]:text-xl'}`}
      >
        Asador El Casar
      </span>
    </a>
  )
}
