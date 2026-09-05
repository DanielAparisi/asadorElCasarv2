# Asador El Casar

Web pública y panel de administración del Asador El Casar. React + Vite en el
cliente y Supabase como backend (base de datos y autenticación).

## Requisitos

- Node.js 20 o superior
- Una cuenta de Supabase con acceso al proyecto `asadorElCasar`

## Puesta en marcha

```bash
npm install
npm run dev
```

Antes del primer arranque hace falta un archivo `.env` en la raíz. No se sube
al repo, y sin él la app se niega a arrancar con un error que dice cuál falta.

```bash
# Supabase → Project Settings → API
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=

# El dominio público, sin barra final. Vacío hasta que se despliegue.
VITE_SITE_URL=
```

Las tres son `VITE_`, y eso significa que acaban en el bundle y son públicas:
en una app 100 % cliente todo lo que Vite inyecta se puede leer desde el
navegador. Lo que protege los datos es RLS, no el secreto de la clave.
Cualquier valor que sí deba seguir siendo secreto va en una Edge Function,
nunca aquí.

`VITE_SITE_URL` es opcional y hoy está vacía a propósito: de ella cuelgan el
`canonical`, la vista previa del enlace en WhatsApp y la ficha de Google. Si no
hay dominio, esas etiquetas no se escriben —mejor eso que un dominio inventado,
porque una URL equivocada rompe la vista previa para todo el mundo.

## Idioma del proyecto

**El código está en inglés; los textos que ve el cliente están en español.**

Nombres de archivos, componentes, funciones, variables, tipos y comentarios en
inglés. Todo lo que aparece en pantalla —titulares, botones, mensajes de
error— en español, porque el asador y sus clientes lo son. Las rutas
(`/admins/platos/nuevo`) y las anclas (`#la-carta`) también siguen en español:
son direcciones que el usuario ve y que romperían enlaces guardados.

## Estructura

Agrupada por dominio, no por tipo de archivo: lo que se toca junto vive junto.

```
src/
  app/                 App: montaje del router y code splitting
  features/
    landing/           web pública (secciones, textos, HomePage)
    menu/              la carta: tipos, datos y useMenu()
    auth/              sesión, login y guards de ruta
    admin/             panel de administración
  shared/
    components/ui/     lenguaje visual (Button, Tag, PhotoFrame…)
    components/icons/  iconos SVG
    lib/               cliente de Supabase
    pages/             404
```

Cada feature tiene dentro sus `components/`, `hooks/` y `pages/`. `shared/`
queda para lo genuinamente compartido entre features.

## Comandos

| comando | qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | comprobación de tipos (`tsc -b`) y build de producción |
| `npm run lint` | ESLint |
| `npm run format` | Prettier sobre todo el repo |
| `npm run format:check` | comprueba el formato sin tocar nada (lo que corre el CI) |
| `npm run types:db` | regenera `src/shared/lib/database.types.ts` desde el esquema real. **Después de cada migración** |
| `npm run preview` | sirve el build de producción |

## Documentación

- `docs/arquitectura.md` — **cómo está montado el proyecto y por qué**
- `docs/panel.md` — decisiones de diseño del panel y del modelo de datos
- `docs/nextTasks.md` — trabajo pendiente por orden de prioridad
- `docs/seguridad.md` — notas de seguridad
- `supabase/migrations/` — SQL con prefijo `<timestamp>_`, listo para
  `supabase db push` (lo aplicado hasta hoy se pegó a mano en el SQL Editor)
