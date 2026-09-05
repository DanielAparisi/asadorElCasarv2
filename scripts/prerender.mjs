/**
 * Bakes the landing page into dist/index.html.
 *
 * Runs after `vite build`, as a second, separate build: Vite compiles
 * `src/entry-server.tsx` for Node, this imports it, renders the page to a
 * string and drops it inside the `#root` that was empty.
 *
 * A second build and not a plugin because the two need opposite targets —one
 * for the browser, one for Node— and because it has to happen after the client
 * bundle exists: the HTML it edits is the client build's output.
 *
 * The server bundle is deleted at the end. It is a build artefact of a build
 * artefact, and leaving it in `dist/` would deploy it.
 */
import { build } from 'vite'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = resolve(root, 'dist/server')
const indexPath = resolve(root, 'dist/index.html')

await build({
  root,
  logLevel: 'warn',
  build: {
    ssr: resolve(root, 'src/entry-server.tsx'),
    outDir: serverDir,
    emptyOutDir: true,
    // The client build already wrote the real stylesheet; this one would only
    // produce a copy nobody links to.
    cssCodeSplit: false,
  },
})

const { render } = await import(resolve(serverDir, 'entry-server.js'))
const html = await readFile(indexPath, 'utf8')

const EMPTY_ROOT = '<div id="root"></div>'

// Loud rather than silent: if Vite ever changes how it writes the container,
// a silent no-op here would ship an empty page that still passes the build and
// only shows up as a bad LCP weeks later.
if (!html.includes(EMPTY_ROOT)) {
  throw new Error(
    `No se encontró ${EMPTY_ROOT} en dist/index.html: el prerender no se aplicó.`,
  )
}

await writeFile(
  indexPath,
  html.replace(EMPTY_ROOT, `<div id="root">${render()}</div>`),
)
await rm(serverDir, { recursive: true, force: true })

const kb = (Buffer.byteLength(render()) / 1024).toFixed(1)
console.log(`prerender: ${kb} kB de HTML pintado dentro de #root`)
