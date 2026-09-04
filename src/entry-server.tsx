import { renderToString } from 'react-dom/server'
import HomePage from './features/landing/pages/HomePage'
import ErrorBoundary from './shared/components/ErrorBoundary'

/**
 * The landing page, rendered to HTML at build time.
 *
 * It exists because the browser used to receive `<div id="root"></div>` and
 * nothing else: the headline, the address and the opening hours did not appear
 * until 68 kB of JavaScript had downloaded, parsed and run. Now they are in
 * the HTML, and the JavaScript only takes over what is already painted.
 *
 * It renders exactly what `App` renders on `/` —`ErrorBoundary` wrapping
 * `HomePage`, no router— because anything else would be a hydration mismatch:
 * React compares this markup with what the client produces and, if they
 * disagree, throws it away and repaints, which costs more than it saved.
 *
 * `App` itself is deliberately not imported: it reads
 * `window.location.pathname` while the module loads, and there is no `window`
 * in Node. That is the price of leaving the router out of the landing chunk,
 * and this is where it gets paid.
 *
 * The dishes are not prerendered. They come from Supabase in an effect, which
 * does not run here, so what gets baked in is `DishCardSkeleton` — which is
 * what the browser paints today anyway, and it reserves the exact space the
 * real cards take, so nothing jumps when they arrive.
 */
export function render() {
  return renderToString(
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>,
  )
}
