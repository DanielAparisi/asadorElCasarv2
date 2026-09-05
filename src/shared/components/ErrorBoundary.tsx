import { Component, type ErrorInfo, type ReactNode } from 'react'
import { POSTER_BORDER, POSTER_SHADOW } from './ui/tokens'

/**
 * Last line of defence: a `throw` while rendering unmounts the whole tree and
 * leaves a white screen with no clue. This catches it and paints something.
 *
 * It has to be a class: React only gives the error hooks
 * (`getDerivedStateFromError` / `componentDidCatch`) to class components.
 *
 * It does not catch everything, and that is by design in React: event handlers,
 * `setTimeout` callbacks and rejected promises never reach it. Only errors
 * thrown during render, in lifecycle methods, or in constructors below it.
 */

type Props = { children: ReactNode }
type State = { failed: boolean }

class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No error tracking service in this project, so the console is all there
    // is. In dev React prints it anyway; in production this is the only trace
    // left, and `componentStack` is what says *where* it broke.
    console.error('Error no controlado en render:', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="min-h-svh flex items-center justify-center bg-bg px-6">
        <div
          className={`bg-card ${POSTER_BORDER} ${POSTER_SHADOW} rounded-[2px] p-8 text-center max-w-md`}
        >
          <p className="text-2xl font-bold uppercase tracking-[0.04em] mb-3">
            Algo se ha roto
          </p>
          <p className="mb-6 text-ink">
            Ha fallado algo al pintar esta página. Vuelve a cargarla; si sigue
            igual, avísanos.
          </p>
          {/* A full reload, not a router navigation: after an unhandled error
              the React tree is discarded and the surest fix is a clean boot. */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`inline-flex items-center justify-center px-6.5 py-4 rounded-[2px] ${POSTER_BORDER}
              bg-red text-white hover:bg-red-dark text-[1.0625rem] font-bold uppercase
              tracking-[0.04em] leading-tight ${POSTER_SHADOW}
              active:translate-x-1 active:translate-y-1 active:shadow-[3px_3px_0_var(--color-ink)]
              transition-[transform,box-shadow,background-color] duration-150`}
          >
            Recargar
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
