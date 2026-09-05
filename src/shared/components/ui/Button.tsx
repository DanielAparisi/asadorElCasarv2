import { POSTER_BORDER, POSTER_SHADOW } from './tokens'

type Variant = 'red' | 'paper' | 'ghost'

type ButtonProps = {
  variant: Variant
  href: string
  className?: string
  children: React.ReactNode
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export function Button({
  variant,
  href,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = `inline-flex items-center justify-center px-6.5 py-4 rounded-[2px] ${POSTER_BORDER}
    text-[1.0625rem] font-bold uppercase tracking-[0.04em] leading-tight whitespace-nowrap
    transition-[transform,box-shadow,background-color,color] duration-150
    max-[560px]:w-full max-[560px]:whitespace-normal max-[560px]:text-center`

  // On press the block "drops" onto its own shadow.
  const withShadow = `${POSTER_SHADOW} active:translate-x-1 active:translate-y-1
    active:shadow-[3px_3px_0_var(--color-ink)]`

  const variants: Record<Variant, string> = {
    red: `bg-red text-white hover:bg-red-dark ${withShadow}`,
    paper: `bg-bg text-ink hover:bg-ink hover:text-bg ${withShadow}`,
    // On a dark background the border turns light and the shadow goes away:
    // a black shadow on black is invisible.
    ghost: 'bg-transparent text-bg border-bg hover:bg-bg hover:text-ink',
  }

  return (
    <a
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  )
}

/** Button variant for ink backgrounds: no shadow, light border. */
export const BUTTON_ON_INK =
  'border-bg shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none'
