import { useEffect, useState } from 'react'

/**
 * Full-screen loading indicator, in the house visual language: flat blocks
 * with thick borders and hard shadows.
 *
 * It waits `delayMs` before showing up. Reading the session from localStorage
 * usually takes milliseconds, and a spinner that appears and vanishes in 50 ms
 * reads as a flicker: more annoying than a blank instant. On a fast load
 * nothing is ever painted here.
 */

const SCREEN = 'min-h-svh flex flex-col items-center justify-center gap-7 bg-bg'

const BLOCK = `w-7 h-7 border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)]
  animate-jump motion-reduce:animate-heartbeat`

// The per-block offset is what creates the cascade. It is an arbitrary value
// because it belongs to this component, not to the theme.
const BLOCKS = [
  { color: 'bg-red', delay: '[animation-delay:0ms]' },
  { color: 'bg-amber', delay: '[animation-delay:140ms]' },
  { color: 'bg-card', delay: '[animation-delay:280ms]' },
]

function Spinner({ delayMs = 250 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  // The space is reserved anyway so the layout does not jump on appearance.
  if (!visible) return <div className={SCREEN} aria-hidden="true" />

  return (
    // role="status" + aria-live: screen readers announce the wait without
    // stealing focus from wherever the user is.
    <div className={SCREEN} role="status" aria-live="polite">
      {/* py-3 reserves the travel of the jump: without it the group changes
          height when the blocks rise. */}
      <div className="flex gap-3.5 py-3" aria-hidden="true">
        {BLOCKS.map((block) => (
          <span
            key={block.color}
            className={`${BLOCK} ${block.color} ${block.delay}`}
          />
        ))}
      </div>

      <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.22em] text-ink-mute">
        Cargando
      </p>
    </div>
  )
}

export default Spinner
