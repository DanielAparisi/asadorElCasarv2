import { MARQUEE_TAGLINES } from '../content'

/**
 * The red band of selling points under the hero.
 *
 * Purely decorative: the same claims appear as real text elsewhere on the
 * page, so it is hidden from screen readers.
 */
function MarqueeBand() {
  return (
    <div
      className="flex items-center gap-5 overflow-hidden px-6 py-3.25 bg-red
        border-y-[3px] border-ink font-mono text-[0.8125rem] font-bold uppercase
        tracking-[0.2em] text-white whitespace-nowrap
        max-[900px]:gap-3.5 max-[900px]:text-xs max-[900px]:tracking-[0.16em]"
      aria-hidden="true"
    >
      {MARQUEE_TAGLINES.map((tagline, index) => (
        <span key={index} className="contents">
          <span>{tagline}</span>
          {index < MARQUEE_TAGLINES.length - 1 && (
            <span className="opacity-75">◆</span>
          )}
        </span>
      ))}
    </div>
  )
}

export default MarqueeBand
