import { createHash } from 'node:crypto'
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
 * Injects the Content-Security-Policy into the built HTML.
 *
 * Production only: in development Vite needs websockets and inline scripts for
 * HMR, and a strict CSP would break it.
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
 */
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
function headPlugin(siteUrl: string, supabaseUrl: string, jsonLd: string): Plugin {
  // Absolute if the site has a domain, relative otherwise. A relative og:image
  // is ignored by some crawlers, but a wrong absolute one is broken for all of
  // them.
  const imageUrl = siteUrl ? `${siteUrl}${OG_IMAGE_PATH}` : OG_IMAGE_PATH

  const metaTags = [
    { name: 'description', content: SITE_DESCRIPTION },
    { name: 'theme-color', content: '#f4f1ea' },
    // Let the photo of the dish be the big preview in the results, and let the
    // snippet run as long as it needs. Both default to something smaller.
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
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
        html: html.replace(/<title>.*?<\/title>/, `<title>${SITE_TITLE}</title>`),
        tags: [
          // The public menu asks Supabase for the dishes as soon as it paints,
          // so the connection is worth opening while the JavaScript downloads.
          ...(supabaseUrl
            ? [
                {
                  tag: 'link',
                  attrs: { rel: 'preconnect', href: supabaseUrl, crossorigin: '' },
                  injectTo: 'head-prepend' as const,
                },
              ]
            : []),
          ...metaTags.map((attrs) => ({ tag: 'meta', attrs, injectTo: 'head' as const })),
          ...(siteUrl
            ? [{ tag: 'link', attrs: { rel: 'canonical', href: siteUrl }, injectTo: 'head' as const }]
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
    "frame-src 'none'",
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/['"]/g, '') ?? ''
  // No domain yet (task 4, the deploy): the tags that need an absolute URL are
  // left out until VITE_SITE_URL says what it is.
  const siteUrl = (env.VITE_SITE_URL?.replace(/['"]/g, '') ?? '').replace(/\/$/, '')

  // Built once and shared: the CSP needs the hash of exactly the same string
  // the browser receives.
  const jsonLd = JSON.stringify(buildRestaurantJsonLd(siteUrl), null, 2)
  const jsonLdHash = `'sha256-${createHash('sha256').update(jsonLd).digest('base64')}'`

  return {
    plugins: [
      react(),
      tailwindcss(),
      headPlugin(siteUrl, supabaseUrl, jsonLd),
      cspPlugin(supabaseUrl, jsonLdHash),
      llmsTxtPlugin(siteUrl),
    ],
  }
})
