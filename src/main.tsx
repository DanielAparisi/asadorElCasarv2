import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App, { isLanding } from './app/App'

const root = document.getElementById('root')!

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// `/` arrives already painted from the build (see entry-server.tsx), and the
// job here is to adopt that markup rather than throw it away and repaint it.
//
// It has to be `isLanding` —the very flag App routes on— and not "does #root
// have children". There is one index.html and the hosting serves it for every
// path, so `/admins` receives the prerendered *landing* inside `#root` too.
// Hydrating there would ask React to match the menu against what the router
// paints, which never matches: React drops the whole tree, repaints from
// scratch and logs an error. Every route but `/` has to start clean.
if (isLanding) {
  hydrateRoot(root, app)
} else {
  // The landing markup is someone else's page. Out before React looks at it.
  root.replaceChildren()
  createRoot(root).render(app)
}
