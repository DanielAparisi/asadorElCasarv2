import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Inyecta la Content-Security-Policy en el HTML del build.
 *
 * Solo en producción: en desarrollo Vite necesita websockets e inline scripts
 * para el HMR, y una CSP estricta lo rompería.
 *
 * Es una segunda línea de defensa. La primera es que React escapa todo lo que
 * interpola, así que un XSS necesitaría un `dangerouslySetInnerHTML` o un
 * `href` con `javascript:`. La CSP existe para el día en que alguien introduzca
 * uno de los dos sin darse cuenta: aunque se inyecte un script, el navegador se
 * niega a ejecutarlo.
 *
 * Importa más de lo que parece porque supabase-js guarda el token de sesión en
 * localStorage: un XSS en esta app no es un `alert()`, es robar la sesión de un
 * admin y con ella la capacidad de escribir en la base de datos.
 */
function cspPlugin(supabaseUrl: string): Plugin {
  const directivas = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // Sin 'unsafe-inline' ni 'unsafe-eval': lo que de verdad frena un XSS.
    "script-src 'self'",
    // Tailwind compila a un archivo, pero React inyecta estilos inline en
    // algunos casos. El riesgo de un estilo inline es mucho menor.
    // googleapis: la hoja de estilos de Google Fonts (Anton, Space Grotesk,
    // Space Mono). Sin esto el navegador la bloquea y cae la tipografía.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // blob: y data: para previsualizar fotos antes de subirlas a Storage.
    `img-src 'self' data: blob: ${supabaseUrl}`,
    // gstatic: los archivos .woff2 que sirve Google Fonts.
    "font-src 'self' data: https://fonts.gstatic.com",
    // Único destino de red permitido: Supabase. wss para Realtime.
    `connect-src 'self' ${supabaseUrl} ${supabaseUrl.replace('https://', 'wss://')}`,
    // Un formulario inyectado no puede enviar credenciales a otro dominio.
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
              content: directivas.join('; '),
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
