/**
 * Shared canvas for every icon.
 *
 * Fixes the box (24×24), the rendered size and `aria-hidden`: icons on this
 * site always accompany text or sit inside a link with an `aria-label`, so
 * they must never announce themselves.
 *
 * Strokes use `currentColor` so they inherit from their container: that is why
 * the same icon works in the header (white on red) and in the footer (paper on
 * ink) without variants.
 */
function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg aria-hidden="true" className="w-5 h-5 flex-none block" viewBox="0 0 24 24">{children}</svg>
  )
}

export default IconBase
