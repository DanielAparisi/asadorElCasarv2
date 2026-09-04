import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'

const root = document.getElementById('root')!

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// `/` arrives already painted from the build (see entry-server.tsx), and the
// job here is to adopt that markup rather than throw it away and repaint it.
// Every other route arrives empty, so there is nothing to hydrate.
//
// The check is what the element holds and not the path, so that the two stay
// in step on their own: whatever the prerender decides to bake in, this reads
// it off the page.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
