import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  buildLlmsTxt,
  buildRestaurantJsonLd,
  GEO_META,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from './src/features/landing/seo.ts'

/**
 * Writes the whole head that does not depend on React: the title, the
 * description, the link preview, the location and the business card.
 *
 * It has to happen here and not in a component: a crawler —Google, WhatsApp,
 * Facebook— reads the HTML it downloads, and this app paints everything from
 * JavaScript. Tags injected by React arrive too late for the only readers that
 * care about them.
 *
 * It applies in development too, unlike the CSP: this way `npm run dev` shows
 * exactly what gets deployed, and the tags can be checked without a build.
 */
function headPlugin(
  siteUrl: string,
  supabaseUrl: string,
  jsonLd: string,
): Plugin {
  // Absolute if the site has a domain, relative otherwise. A relative og:image
  // is ignored by some crawlers, but a wrong absolute one is broken for all of
  // them.
  const imageUrl = siteUrl ? `${siteUrl}${OG_IMAGE_PATH}` : OG_IMAGE_PATH

  const metaTags = [
    { name: 'description', content: SITE_DESCRIPTION },
    { name: 'theme-color', content: '#f4f1ea' },
    // Let the photo of the dish be the big preview in the results, and let the
    // snippet run as long as it needs. Both default to something smaller.
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large, max-snippet:-1',
    },
    // Where the grill is. schema.org says it too, further down, but these are
    // read by Bing and by the directories that scrape rather than parse.
    ...GEO_META,
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: 'es_ES' },
    { property: 'og:title', content: SITE_TITLE },
    { property: 'og:description', content: SITE_DESCRIPTION },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:alt', content: `Logo de ${SITE_NAME}` },
    ...(siteUrl ? [{ property: 'og:url', content: siteUrl }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
  ]

  return {
    name: 'head',
    transformIndexHtml(html) {
      return {
        // The title lives in seo.ts next to the description it has to agree
        // with; index.html carries a plain one so the file still makes sense
        // opened on its own.
        html: html.replace(
          /<title>.*?<\/title>/,
          `<title>${SITE_TITLE}</title>`,
        ),
        tags: [
          // The public menu asks Supabase for the dishes as soon as it paints,
          // so the connection is worth opening while the JavaScript downloads.
          ...(supabaseUrl
            ? [
                {
                  tag: 'link',
                  attrs: {
                    rel: 'preconnect',
                    href: supabaseUrl,
                    crossorigin: '',
                  },
                  injectTo: 'head-prepend' as const,
                },
              ]
            : []),
          ...metaTags.map((attrs) => ({
            tag: 'meta',
            attrs,
            injectTo: 'head' as const,
          })),
          ...(siteUrl
            ? [
                {
                  tag: 'link',
                  attrs: { rel: 'canonical', href: siteUrl },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          {
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: jsonLd,
            injectTo: 'head' as const,
          },
        ],
      }
    },
  }
}

/**
 * Injects the Content-Security-Policy into the built HTML.
 *
 * Production only: in development Vite needs websockets and inline scripts for
 * HMR, and a strict CSP would break it. That asymmetry is the thing to keep in
 * mind while reading the directives below — none of them is exercised by
 * `npm run dev`, so a mistake here shows up for the first time in front of a
 * customer. `npm run preview` is the only place it can be caught earlier.
 *
 * This is a second line of defence. The first is that React escapes everything
 * it interpolates, so an XSS would need a `dangerouslySetInnerHTML` or a
 * `javascript:` href. The CSP exists for the day someone introduces one of the
 * two without noticing: even if a script is injected, the browser refuses to
 * run it.
 *
 * It matters more than it looks because supabase-js keeps the session token in
 * localStorage: an XSS in this app is not an `alert()`, it is stealing an
 * admin's session and with it the ability to write to the database.
 *
 * `jsonLdHash` is not a parameter for tidiness — it is half of a pact with
 * `headPlugin`. Both are handed the *same* JSON-LD string built once in
 * `defineConfig`: one writes it into the page, the other authorises exactly
 * that byte sequence. Build the string twice and a single space of difference
 * means the browser blocks the business card, silently and only in production.
 *
 * Its ceiling is that it travels as a `<meta>`. `frame-ancestors`,
 * `report-uri` and `sandbox` are ignored there, so nothing here can stop the
 * panel being framed for clickjacking, and the policy only covers index.html
 * rather than every response. The fix is not in this file: it is to serve
 * these same directives as a real header from the hosting once there is one
 * (docs/seguridad.md, and task 16 of docs/nextTasks.md).
 */
function cspPlugin(supabaseUrl: string, jsonLdHash: string): Plugin {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // No 'unsafe-inline' and no 'unsafe-eval': this is what actually stops XSS.
    // The hash is the JSON-LD block of the business card. A `<script>` is a
    // `<script>` for the CSP even when it holds data and nothing executes, so
    // without its hash the browser blocks it — and Google reads a rendered
    // page. One hash, and 'unsafe-inline' stays out.
    `script-src 'self' ${jsonLdHash}`,
    // No 'unsafe-inline' here either, which is not the usual state of a React
    // app. It holds because nothing in this project passes a `style` prop:
    // Tailwind compiles to a file, and the checked build has zero `style="`
    // attributes and zero inline `<style>` blocks. Assigning `el.style.x` from
    // JavaScript is not what this directive governs, so React setting a
    // display on an element at runtime is unaffected.
    //
    // ⚠️ Adding a single `style={{ … }}` anywhere brings it back — and it
    // fails silently: the element simply paints unstyled in production, never
    // in `npm run dev`, because the CSP is build-only. Use a class.
    "style-src 'self'",
    // blob: and data: to preview photos before uploading them to Storage.
    `img-src 'self' data: blob: ${supabaseUrl}`,
    // The fonts are served from this same origin since they stopped coming
    // from Google Fonts, so no third party needs to be allowed here.
    "font-src 'self' data:",
    // The only network destination allowed: Supabase. wss for Realtime.
    `connect-src 'self' ${supabaseUrl} ${supabaseUrl.replace('https://', 'wss://')}`,
    // An injected form cannot post credentials to another domain.
    "form-action 'self'",
    // The map of LocationSection is a Google Maps iframe. Naming the origin and
    // not '*' keeps the point of the directive: this is the only page anyone
    // can embed inside, and 'none' here left the map as an empty frame in
    // production while `npm run dev` showed it fine (the plugin is build-only).
    'frame-src https://www.google.com',
    'upgrade-insecure-requests',
  ]

  return {
    name: 'csp',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: directives.join('; '),
            },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

/**
 * Writes `llms.txt` at the root of the site.
 *
 * A static file in `public/` would have been one line instead of this, and it
 * is exactly what this avoids: the opening hours and the address would have
 * been typed a third time —after content.ts and the JSON-LD— and the third
 * copy is the one that goes stale, because nobody remembers it exists.
 *
 * `configureServer` as well as `generateBundle` so that `npm run dev` serves
 * the same file the deploy does. Otherwise the only way to check it is to
 * build.
 */
function llmsTxtPlugin(siteUrl: string): Plugin {
  const body = () => buildLlmsTxt(siteUrl)

  return {
    name: 'llms-txt',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/llms.txt') return next()
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        res.end(body())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: body() })
    },
  }
}

/**
 * The public origin of the site — `https://asadorelcasar.es` — or an empty
 * string while there is not one yet.
 *
 * Everything that needs an absolute URL hangs off this: `og:url`, the
 * `canonical`, the absolute `og:image` of the WhatsApp preview, and the `url`
 * and `hasMenu` of the Google business card. When it comes back empty those
 * fields are left out rather than guessed, because a canonical pointing at a
 * domain that is not ours is worse than no canonical at all.
 *
 * It is resolved here, at build time, and not read in the browser, for the same
 * reason `headPlugin` exists: a preview crawler reads the HTML it downloads and
 * never runs the JavaScript, so `window.location.origin` would arrive too late
 * for the only readers these tags are written for.
 *
 * Step by step:
 *
 * 1. Look for the value in three places, in order of how much they are worth.
 * 2. Take the first one that is actually filled in.
 * 3. Clean it up: quotes, whitespace, missing protocol, trailing slash.
 * 4. Check it parses as a URL, and fail the build loudly if it does not.
 *
 * The reason for steps 1 and 2 is that the domain is not known yet and this
 * should not stay broken until it is: the hosting already knows what URL it is
 * serving, and it says so in an environment variable of its own. So the moment
 * the site is deployed the tags start being correct on their own, and the day a
 * real domain is pointed at it they follow along without touching any code.
 */
function resolveSiteUrl(env: Record<string, string>): string {
  // ── Step 1. The three candidates, best first ──────────────────────────────
  const candidates = [
    // 1a. What .env or the hosting's dashboard says. This one wins over
    //     everything: it is the only one a person chose on purpose.
    ['VITE_SITE_URL', env.VITE_SITE_URL],

    // 1b. Vercel. Deliberately NOT `VERCEL_URL`: that one is the URL of this
    //     particular deployment (`asador-a1b2c3.vercel.app`) and changes with
    //     every push, which is exactly what a canonical must never do.
    //     `VERCEL_PROJECT_PRODUCTION_URL` is the stable production domain, and
    //     it becomes the custom domain by itself once one is attached.
    ['VERCEL_PROJECT_PRODUCTION_URL', env.VERCEL_PROJECT_PRODUCTION_URL],

    // 1c. Netlify, where the equivalent is called `URL`. Guarded behind the
    //     `NETLIFY` flag because `URL` is far too generic a name to trust on a
    //     laptop: plenty of shells and tools set one for their own reasons.
    ['URL', env.NETLIFY ? env.URL : undefined],
  ] as const

  // ── Step 2. The first one with something in it ────────────────────────────
  // `.trim()` before the emptiness check: a variable set to a single space in a
  // hosting dashboard is a variable nobody filled in.
  const found = candidates.find(([, value]) => value?.trim())
  if (!found) return ''
  const [name, value] = found as readonly [string, string]

  // ── Step 3. Clean it up ───────────────────────────────────────────────────
  // Quotes first: `VITE_SITE_URL="https://…"` in a .env keeps its quotes here,
  // and they would end up inside the tag.
  let raw = value.trim().replace(/['"]/g, '')

  // The hosting variables come as a bare hostname, with no scheme — Vercel
  // hands over `asador.vercel.app` and not `https://asador.vercel.app`. Add it
  // when it is missing; https and not http, because neither host serves
  // anything else and a canonical over http would redirect.
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`

  // No trailing slash. Every consumer builds `${siteUrl}/algo`, so leaving it
  // would produce `https://…//og.jpg` — which loads, but is a second URL for
  // the same image and the crawlers' caches treat it as such.
  raw = raw.replace(/\/+$/, '')

  // ── Step 4. Make sure it is a real URL ────────────────────────────────────
  // A typo here is invisible: the build passes, the tags come out, and the
  // damage shows up weeks later as a WhatsApp preview nobody can explain. So
  // it stops the build instead, naming the variable that carried the value.
  try {
    // `.origin` also drops any path someone pasted along with the domain.
    return new URL(raw).origin
  } catch {
    throw new Error(
      `${name} no es una URL válida: ${JSON.stringify(value)}. ` +
        'Tiene que ser el origen del sitio, por ejemplo https://asadorelcasar.es',
    )
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/['"]/g, '') ?? ''
  // Empty until there is a domain, or until this is built on the hosting —
  // whichever comes first. See resolveSiteUrl above.
  const siteUrl = resolveSiteUrl(env)

  // Built once and shared: the CSP needs the hash of exactly the same string
  // the browser receives.
  const jsonLd = JSON.stringify(buildRestaurantJsonLd(siteUrl), null, 2)
  const jsonLdHash = `'sha256-${createHash('sha256').update(jsonLd).digest('base64')}'`

  return {
    // `@` is the root of src/. Both this and the `paths` of tsconfig.app.json
    // are needed: TypeScript resolves the types, Vite resolves the file, and
    // declaring only the first compiles green and fails at runtime.
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    plugins: [
      react(),
      tailwindcss(),
      headPlugin(siteUrl, supabaseUrl, jsonLd),
      cspPlugin(supabaseUrl, jsonLdHash),
      llmsTxtPlugin(siteUrl),
    ],
  }
})
