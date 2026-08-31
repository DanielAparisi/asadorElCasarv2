# Asador El Casar

Web pública y panel de administración del Asador El Casar. React + Vite en el
cliente y Supabase como backend (base de datos y autenticación).

## Requisitos

- Node.js 20 o superior
- Una cuenta de Supabase con acceso al proyecto `asadorElCasar`

## Puesta en marcha

```bash
npm install
cp .env.example .env   # y rellena los valores del proyecto de Supabase
npm run dev
```

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
| `npm run preview` | sirve el build de producción |

## Documentación

- `docs/arquitectura.md` — **cómo está montado el proyecto y por qué**
- `docs/panel.md` — decisiones de diseño del panel y del modelo de datos
- `docs/nextTasks.md` — trabajo pendiente por orden de prioridad
- `docs/seguridad.md` — notas de seguridad
- `supabase/migrations/` — SQL, aplicado a mano desde el SQL Editor
