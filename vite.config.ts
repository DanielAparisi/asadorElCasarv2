import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
function cspPlugin(supabaseUrl: string): Plugin {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // No 'unsafe-inline' and no 'unsafe-eval': this is what actually stops XSS.
    "script-src 'self'",
    // Tailwind compiles to a file, but React injects inline styles in some
    // cases. The risk of an inline style is far lower.
    // googleapis: the Google Fonts stylesheet (Anton, Space Grotesk, Space
    // Mono). Without it the browser blocks it and the typography falls back.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // blob: and data: to preview photos before uploading them to Storage.
    `img-src 'self' data: blob: ${supabaseUrl}`,
    // gstatic: the .woff2 files Google Fonts serves.
    "font-src 'self' data: https://fonts.gstatic.com",
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/['"]/g, '') ?? ''

  return {
    plugins: [react(), tailwindcss(), cspPlugin(supabaseUrl)],
  }
})
