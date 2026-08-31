import { POSTER_BORDER } from './tokens'

/** Photo placeholder: diagonal hatch inside a frame with a hard shadow. */
export function PhotoFrame({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative flex items-center justify-center ${POSTER_BORDER}
        shadow-[9px_9px_0_var(--color-ink)]
        bg-[repeating-linear-gradient(45deg,var(--color-cream)_0_12px,var(--color-cream-alt)_12px_24px)]
        ${className}`}
    >
      <span className="font-mono text-sm tracking-[0.02em] text-ink-mute">{children}</span>
    </div>
  )
}
