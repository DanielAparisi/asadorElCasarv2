# Arquitectura del proyecto

Cómo está montado el Asador El Casar y por qué. Documento de referencia: si
algo aquí se contradice con el código, gana el código — pero conviene
actualizar esto.

Actualizado el 05/09/2026. 64 archivos de código en `src/`, 4.095 líneas de
TypeScript — de las cuales 303 son `shared/lib/database.types.ts`, que está
generado y no se escribe a mano.

---

## 1. En una frase

Una SPA de React servida como archivos estáticos, que habla directamente con
Supabase. **No hay backend propio**: la seguridad la pone Postgres con RLS, no
un servidor intermedio.

```
Navegador ──► React (Vite build, estático) ──► Supabase
                                               ├─ Auth (sesión en localStorage)
                                               └─ Postgres + RLS
```

Consecuencia que ordena todo lo demás: **el cliente es manipulable**. Cualquier
comprobación que importe (¿es admin?, ¿puede escribir?) tiene que existir en la
base de datos. Lo que hay en React son redirecciones y ergonomía, no seguridad.

---

## 2. Son dos apps en un repo

| | Carta pública | Panel |
|---|---|---|
| Rutas | `/` | `/admins/*`, `/login` |
| Quién entra | todo el mundo, sin sesión | 3-4 personas con sesión |
| Prioridad | rápida y bonita | segura y clara |
| Rol de Postgres | `anon` | `authenticated` + `is_admin()` |
| Diseño | sistema visual propio (`shared/ui`) | Tailwind a pelo, feo a propósito |

Comparten la base de datos y el dominio `features/menu/`. **No comparten
layout, ni navegación, ni bundle** (ver §5) — **ni siquiera el cliente de
Supabase**: la carta habla con PostgREST por `fetch` y el cliente se queda para
el panel, que es lo que mantiene los 54 kB de la librería fuera de la página que
ve todo el mundo (§6).

El principio que separa las dos: *el panel puede ser feo; la carta no*. El
esfuerzo de diseño va al lado público; el panel solo tiene que ser difícil de
romper.

---

## 3. Todos los archivos, y de quién depende cada uno

Agrupados **por dominio, no por tipo de archivo**: lo que se toca junto vive
junto. Añadir un campo a un plato toca `features/menu/` y poco más.

En cada archivo, `usa →` es lo que importa y `← lo usan` quién lo importa a él.
Sale del grafo de imports real, no de memoria. Entre paréntesis, las líneas.

### La raíz

```
asadorElCasarv1/
├── index.html              el único HTML. Preload de las dos fuentes del primer
│                           pintado, meta referrer, <title> de reserva y #root.
│                           El resto del <head> lo escribe vite.config.ts al
│                           construir, y dentro de #root acaba la landing ya
│                           pintada (scripts/prerender.mjs)
├── vite.config.ts          React, Tailwind, el alias @/ y tres plugins propios
├── scripts/prerender.mjs   segunda build, en Node: hornea la landing en el HTML
├── package.json            dev, build, lint, format, format:check, types:db,
│                           preview
├── eslint.config.js        ESLint plano: js + typescript-eslint + react-hooks
├── tsconfig.json           raíz; delega en los dos de abajo
├── tsconfig.app.json       el de src/: incluye paths { "@/*": ["./src/*"] }
├── tsconfig.node.json      el de los archivos que corren en Node (vite.config)
├── .prettierrc.json        sin punto y coma, comilla simple, 80 columnas
├── .prettierignore         docs/*.md, .claude/, .agents/, lock y supabase/.temp
├── .env                    no se sube. VITE_SUPABASE_URL,
│                           VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SITE_URL
├── .github/workflows/ci.yml  npm ci → lint → format:check → build
│
├── public/                 se copia tal cual a la raíz del sitio
│   ├── favicon.svg
│   ├── icons.svg           sprite heredado; hoy los iconos son componentes
│   ├── og.jpg              la imagen de la vista previa al pegar el enlace.
│   │                       Aquí y no en src/assets porque el build le pondría
│   │                       un hash distinto en cada versión y las cachés de
│   │                       WhatsApp o Facebook se quedan con la URL vieja
│   ├── robots.txt          deja /admins y /login fuera del rastreo
│   └── fonts/              8 .woff2: Anton, Space Grotesk (variable) y Space
│                           Mono, subconjuntos latin y latin-ext
│
├── docs/
│   ├── arquitectura.md     este archivo
│   ├── panel.md            decisiones del panel y del modelo de datos
│   ├── cleanCode.md        pautas de estilo y deuda pendiente
│   ├── nextTasks.md        trabajo pendiente por orden de prioridad
│   ├── seguridad.md        notas de seguridad
│   ├── panel-a-mano.md     el panel explicado a quien lo va a usar
│   └── aplicar-migraciones.sql
│
├── supabase/
│   ├── config.toml
│   └── migrations/         8 archivos con prefijo de timestamp (§7)
│
└── dist/                   salida del build. No se versiona
```

`src/assets/hero.png` existe y **no lo importa nadie**: el hero pinta hoy un
`PhotoFrame` vacío. Es el único archivo huérfano del proyecto; o entra en
`HeroSection` o se borra.

### `src/` — la raíz de la aplicación

**`main.tsx`** (29) — el arranque. Decide entre `hydrateRoot` y `createRoot`
según `isLanding`, que importa de `App`. Ver §5.
`usa →` `app/App.tsx`, `index.css`.

**`entry-server.tsx`** (34) — el mismo árbol que `App` pinta en `/`, pero para
Node. Solo lo carga `scripts/prerender.mjs` al construir; no entra en ningún
chunk del navegador.
`usa →` `features/landing/pages/HomePage`, `shared/components/ErrorBoundary`.

**`index.css`** — los ocho `@font-face` y el `@theme static` de Tailwind v4 con
la paleta entera (§9). No lo importa ningún componente: entra por `main.tsx`.

**`assets/logo.jpg`** — 160×160. Solo lo usa `shared/ui/Brand`.

### `src/app/` — el arranque y las rutas

**`App.tsx`** (48) — mira `window.location.pathname` **al cargar el módulo** y
decide si hace falta un router. En `/` pinta `HomePage` a pelo; en cualquier
otra ruta carga `Router` con `lazy()`. Exporta `isLanding`, que es la misma
bandera que usa `main.tsx` para decidir si hidrata.
`usa →` `Router` (lazy), `landing/pages/HomePage`, `shared/ErrorBoundary`,
`shared/Spinner`. `← lo usa` `main.tsx`.

**`Router.tsx`** (68) — declara las rutas, los guards y todos los `lazy()` del
panel. **No se descarga en `/`.** Aquí viven las rutas en español.
`usa →` `auth/ProtectedRoutes`, las cinco páginas del panel, `landing/HomePage`,
`shared/NotFoundPage`, `shared/Spinner`. `← lo usa` `App.tsx`.

### `src/features/landing/` — la web pública

**`content.ts`** (97) — el archivo más leído del proyecto: teléfono, dirección,
horario, redes, textos y las coordenadas. **Existe para que el teléfono se
escriba una vez**; aparece en la cabecera, el pie, el hero y ubicación.
`← lo usan` las 8 secciones que necesitan datos y `seo.ts`. No importa nada.

**`seo.ts`** (235) — construye el `<title>`, la descripción, Open Graph, Twitter
Card, las metas `geo.*` y la ficha JSON-LD de tipo `Restaurant`. No lo usa
ningún componente de React: **lo importa `vite.config.ts`**, que es la relación
más rara del repo y la que explica §7.
`usa →` `content.ts`. `← lo usa` `vite.config.ts`.

**`pages/HomePage.tsx`** (59) — compone las nueve secciones en orden y pone el
ancho y el `grid`. Reordenar la página es mover una línea.
`usa →` las 9 secciones + `shared/ui/tokens`.
`← lo usan` `App.tsx`, `Router.tsx` y `entry-server.tsx` — los tres, porque es
la página que se pinta en el cliente, en el router y en el prerenderizado.

Las secciones, todas hijas únicas de `HomePage` salvo donde se diga:

| archivo | qué es | usa → |
|---|---|---|
| `SiteHeader.tsx` (54) | banda de tinta: marca, menú, teléfono | `content`, `ui/Brand`, `icons/PhoneIcon`, `ui/tokens` |
| `HeroSection.tsx` (85) | el único `<h1>` de la web | `content`, `ui/Button`, `ui/Lead`, `ui/PhotoFrame`, `ui/tokens` |
| `MarqueeBand.tsx` (30) | banda roja de reclamos, `aria-hidden` | `content` |
| `MenuSection.tsx` (83) | la carta en cuadrícula, por categorías | `menu/hooks/useMenu`, `DishCard`, `ui/Heading`, `ui/Tag` |
| `DishCard.tsx` (70) | un plato: foto, nombre, precio | `menu/dishPhoto`, `menu/formatPrice`, `menu/types`, `ui/PhotoFrame`, `ui/tokens` |
| `AboutSection.tsx` (41) | «sobre nosotros» | `ui/Heading`, `ui/Lead`, `ui/Tag`, `ui/tokens` |
| `ScheduleSection.tsx` (74) | el horario semanal, 8 celdas | `content`, `ui/Heading`, `ui/tokens` |
| `OrderSection.tsx` (71) | bloque de tinta: reservas y los 3 pasos | `content`, `ui/Button`, `ui/Lead`, `ui/Tag` |
| `LocationSection.tsx` (116) | datos + el iframe de Google Maps | `content`, `ui/Button`, `ui/Heading`, `ui/tokens` |
| `SiteFooter.tsx` (94) | marca, menú repetido, contacto | `content`, `SocialLinks`, `ui/Brand`, `ui/Button`, `ui/tokens`, `icons/WhatsAppIcon` |
| `SocialLinks.tsx` (43) | Instagram, Facebook, teléfono | `content`, tres iconos. **Lo usa `SiteFooter`, no `HomePage`** |

`DishCard` y `MenuSection` son las dos únicas piezas de la landing que tocan el
dominio `menu/`. Las demás solo pintan lo que hay en `content.ts`.

### `src/features/menu/` — la carta, y el único dominio que comparten los dos lados

**`types.ts`** (38) — `Dish` y `Category`, **recortados con `Pick` del esquema
generado**, no escritos a mano. Es el archivo más importado del dominio.
`usa →` `shared/lib/database.types`.
`← lo usan` `useMenu`, `rowGuards`, `landing/DishCard`, `admin/DishForm`,
`admin/useDishes`, `admin/useCategories`, `admin/CategoriesPage`.

**`hooks/useMenu.ts`** (136) — la única puerta a los datos de la carta pública.
**No usa `supabase-js`**: pide sus dos tablas con `fetch` al endpoint REST, que
es lo que la librería habría enviado. Comprueba también las variables de entorno
por su cuenta, porque no puede importar `supabaseEnv` sin arrastrar el chunk del
panel.
`usa →` `types`, `rowGuards`. `← lo usa` `landing/MenuSection`.

**`rowGuards.ts`** (100) — `parseCategories` y `parseDishes`: comprueban en
ejecución que lo que devolvió PostgREST tiene la forma de `types.ts`. Hace falta
**solo aquí**, porque es el único sitio donde entran datos sin un compilador
delante (§6).
`usa →` `types`. `← lo usa` `useMenu`.

**`formatPrice.ts`** (41) — los dos sentidos, `1250 ↔ "12,50 €"`, más
`centsToPriceInput` para el formulario. La conversión existe **una vez**.
`← lo usan` `landing/DishCard`, `admin/DishesPage`, `admin/DishForm`.

**`dishPhoto.ts`** (27) — `photo_path` → URL pública del bucket, compuesta a
mano. **No importa el cliente de Supabase a propósito**: `getPublicUrl()` no
hace ninguna petición, pero importarlo devolvía 54 kB a la landing.
`← lo usan` `landing/DishCard`, `admin/useDishPhoto`, `admin/DishPhotoField`.

### `src/features/auth/` — sesión y acceso

**`hooks/useSession.ts`** (45) — `{ session, loading }`. Una bandera hace que
`onAuthStateChange`, una vez ha hablado, gane siempre a `getSession()` (§6).
`usa →` `shared/lib/supabase`. `← lo usa` `ProtectedRoutes`.

**`hooks/useIsAdmin.ts`** (52) — `{ isAdmin, loading }`. Recibe el `userId` como
argumento **para no abrir una segunda suscripción de auth**, y guarda el
resultado junto al id que consultó.
`usa →` `shared/lib/supabase`. `← lo usa` `ProtectedRoutes`.

**`hooks/useAuth.ts`** (69) — `signUp`, `signIn`, `signOut` y el estado del
envío.
`usa →` `shared/lib/supabase`. `← lo usan` `LoginForm` y `admin/AdminLayout`.

**`components/ProtectedRoutes.tsx`** (53) — `LoginRoute` y `AdminRoute`: **el
guard**. Es quien decide entre spinner, redirección y panel, y por tanto quien
mete `supabase-js` en su chunk y no en el principal.
`usa →` `useSession`, `useIsAdmin`, `LoginPage`, `admin/AdminLayout`,
`shared/Spinner`. `← lo usa` `Router.tsx`.

**`components/LoginForm.tsx`** (106) — el formulario, entrar y registrarse.
`usa →` `useAuth`. `← lo usa` `LoginPage`.

**`pages/LoginPage.tsx`** (7) — la página, que solo envuelve al formulario.
`usa →` `LoginForm`. `← lo usa` `ProtectedRoutes`.

### `src/features/admin/` — el panel

Las cuatro piezas de estilo, que existen para que el panel sea feo **en un solo
sitio** (`docs/cleanCode.md` §1):

| archivo | qué es | relación |
|---|---|---|
| `AdminInput.tsx` (14) | el input, y `ADMIN_FIELD_CLASS` para textarea y select | lo usan `AdminButton`, `DishForm`, `CategoriesPage` |
| `AdminButton.tsx` (19) | el botón, `primary` y `quiet` | usa `AdminInput` (la clase); lo usan `DishForm` y 3 páginas |
| `AdminHeading.tsx` (13) | el título de página | lo usan las 4 páginas con título |
| `AdminField.tsx` (21) | etiqueta + campo debajo | solo lo usa `DishForm` |

**`components/AdminLayout.tsx`** (59) — navegación, correo y cerrar sesión.
Recibe la `session` por props; no la vuelve a pedir.
`usa →` `auth/hooks/useAuth`. `← lo usa` `auth/ProtectedRoutes`.

**`components/DishForm.tsx`** (166) — el formulario compartido por el alta y la
edición. El componente más largo del proyecto, y el que `cleanCode.md` §4
predijo que nacería pasado de 120 líneas.
`usa →` `AdminField`, `AdminInput`, `AdminButton`, `DishPhotoField`,
`useDishes` (por el tipo `DishInput`), `menu/formatPrice`, `menu/types`.
`← lo usan` `NewDishPage` y `EditDishPage`.

**`components/DishPhotoField.tsx`** (84) — elegir foto, previsualizarla y
quitarla.
`usa →` `useDishPhoto`, `menu/dishPhoto`. `← lo usa` `DishForm`.

**`hooks/useDishes.ts`** (175) — la lista completa **con los no disponibles**,
más `createDish`, `updateDish`, `toggleAvailable` y `deleteDish`. Es también
quien borra de Storage la foto que deja de estar referenciada, y por eso es el
único hook que importa a otro hook.
`usa →` `useDishPhoto`, `menu/types`, `shared/lib/supabase`.
`← lo usan` `DishForm` y las cuatro páginas de platos.

**`hooks/useCategories.ts`** (135) — lista, alta, orden y borrado.
`usa →` `menu/types`, `shared/lib/supabase`.
`← lo usan` `CategoriesPage`, `DishesPage`, `NewDishPage`, `EditDishPage` — las
tres últimas solo para traducir `category_id` a un nombre.

**`hooks/useDishPhoto.ts`** (64) — sube (encogida) y borra el archivo. Lo único
del panel que no toca Postgres.
`usa →` `lib/shrinkImage`, `menu/dishPhoto`, `shared/lib/supabase`.
`← lo usan` `useDishes` y `DishPhotoField`.

**`lib/shrinkImage.ts`** (57) — canvas + `toBlob`, a WebP, antes de subir. Sin
dependencias y sin importar nada del proyecto.
`← lo usa` `useDishPhoto`.

Las cinco páginas, todas cargadas con `lazy()` desde `Router.tsx`:

| página | ruta | usa → |
|---|---|---|
| `DishesPage.tsx` (86) | `/admins` | `useDishes`, `useCategories`, `menu/formatPrice`, `AdminHeading`, `AdminButton` |
| `NewDishPage.tsx` (47) | `/admins/platos/nuevo` | `DishForm`, `useDishes`, `useCategories`, `AdminHeading` |
| `EditDishPage.tsx` (91) | `/admins/platos/:id` | `DishForm`, `useDishes`, `useCategories`, `AdminHeading`, `AdminButton`, `shared/NotFoundPage` |
| `CategoriesPage.tsx` (119) | `/admins/categorias` | `useCategories`, `menu/types`, `AdminHeading`, `AdminInput`, `AdminButton` |
| `TeamPage.tsx` (69) | `/admins/equipo` | `useAdmins` |

**`hooks/useAdmins.ts`** (74) — la lista de admins y el alta, que es una llamada
a la función `add_admin` de Postgres.
`usa →` `shared/lib/supabase`, `shared/lib/database.types` (para el tipo
`Admin`). `← lo usa` `TeamPage`.

### `src/shared/` — lo genuinamente compartido

**`lib/database.types.ts`** (303, generado) — el esquema entero de Supabase en
TypeScript. **No se edita a mano**: lo escribe `npm run types:db`. Es la raíz de
la que cuelgan todos los tipos de datos del proyecto.
`← lo usan` `shared/lib/supabase`, `menu/types`, `admin/useAdmins`.

**`lib/supabase.ts`** (21) — `createClient<Database>()`, una sola vez.
**Quien lo importa arrastra 54 kB gzip**, así que la lista de quién lo hace es
la más importante del repo, y son siete: los tres hooks de `auth/`
(`useSession`, `useIsAdmin`, `useAuth`) y los cuatro de `admin/` (`useAdmins`,
`useDishes`, `useCategories`, `useDishPhoto`). Ninguno de `landing/` ni de
`menu/`, y eso es deliberado (§5).
`usa →` `database.types`, `supabaseEnv`.

**`lib/supabaseEnv.ts`** (29) — lee las dos variables y **revienta al cargar el
módulo si faltan**, con un mensaje que las nombra.
`← lo usa` solo `supabase.ts`. `useMenu` repite la comprobación en vez de
importarla, por lo mismo de arriba.

**`components/ErrorBoundary.tsx`** (67) — el único componente de clase del
proyecto, porque `componentDidCatch` no tiene equivalente en hooks.
`usa →` `ui/tokens`. `← lo usan` `App.tsx` y `entry-server.tsx` — los dos, para
que el árbol del prerenderizado sea idéntico al del cliente.

**`components/Spinner.tsx`** (59) — la carga a pantalla completa.
`← lo usan` `App`, `Router` y `ProtectedRoutes`.

**`pages/NotFoundPage.tsx`** (17) — el 404.
`← lo usan` `Router` (la ruta `*`) y `EditDishPage` (un id que no existe).

**`components/ui/`** — el lenguaje visual, solo de la landing:

| archivo | qué es | usa → | ← lo usan |
|---|---|---|---|
| `tokens.ts` (15) | `POSTER_BORDER`, `POSTER_SHADOW`, `PAGE_CONTAINER` | — | 11 archivos: el más usado del proyecto |
| `Button.tsx` (49) | 3 variantes: red, paper, ghost | `tokens` | Hero, Location, Order, Footer |
| `Tag.tsx` (17) | etiqueta mono de sección | — | About, Menu, Order, `Heading` |
| `Heading.tsx` (29) | `Heading` y `SectionHeading` | `Tag` | About, Location, Menu, Schedule |
| `Lead.tsx` (20) | párrafo de entrada | — | About, Hero, Order |
| `PhotoFrame.tsx` (23) | hueco de foto con trama diagonal | `tokens` | Hero, DishCard |
| `Brand.tsx` (33) | logo + nombre. Enlaza con `<a href="/">` y **nunca con `Link`** (§5) | `assets/logo.jpg` | Header, Footer |

**`components/icons/`** — `IconBase.tsx` (24) fija la caja 24×24, el
`aria-hidden` y `currentColor`; de ahí cuelgan `PhoneIcon` (17), `WhatsAppIcon`
(21), `InstagramIcon` (29) y `FacebookIcon` (24). Por el `currentColor`, el
mismo icono sirve en la cabecera (blanco sobre rojo) y en el pie (papel sobre
tinta) sin variantes.
`← los usan` `SiteHeader`, `SiteFooter` y `SocialLinks`.

---

## 4. La regla de dependencias

```
app/  ──►  features/*  ──►  shared/
                │
                └──►  otra feature, solo en los cruces de abajo
```

- **`shared/` no importa nada de `features/`.** Comprobado: ni un solo import.
  Si un componente de `shared/` necesita saber del dominio, no es compartido.
- **`app/` solo conoce páginas y el guard.** No importa hooks, ni `supabase`, ni
  nada de dominio. No es estética: es lo que mantiene el bundle partido (§5).
- **Los cruces horizontales entre features son cuatro**, y conviene tenerlos
  todos escritos porque el documento decía dos y ya iban por cuatro:

| de | a | por qué |
|---|---|---|
| `landing` | `menu` | `MenuSection` → `useMenu`, y `DishCard` → `types`, `formatPrice`, `dishPhoto` |
| `admin` | `menu` | el panel edita lo mismo que la carta enseña: `types`, `formatPrice`, `dishPhoto` |
| `auth` | `admin` | `ProtectedRoutes` → `AdminLayout`: el guard decide qué monta |
| `admin` | `auth` | `AdminLayout` → `useAuth`, para el botón de cerrar sesión |

Los dos primeros dicen lo mismo: **`menu/` no es una feature más, es el dominio
compartido**. Nadie lo importa a él; él no importa a nadie salvo a `shared/`.

Los dos últimos son un **ciclo entre carpetas** —`auth` → `admin` → `auth`— que
no es un ciclo entre archivos y por eso compila y empaqueta sin problema. Es el
único punto del grafo que conviene mirar con recelo: si algún día `AdminLayout`
necesita algo más de `auth`, lo que toca no es un tercer import, es sacar la
sesión a un `SessionContext` (§11).

---

## 5. Del build al primer pintado

Cuatro archivos se reparten una sola pregunta: *qué ve el navegador antes de que
llegue React*.

```
vite build ─┬─► dist/assets/*.js, *.css       el cliente
            └─► index.html  ◄── vite.config.ts escribe el <head> (seo.ts) y la CSP
                    │
scripts/prerender.mjs ──► segunda build, para Node, de src/entry-server.tsx
                    │     la ejecuta, y mete su HTML dentro del #root vacío
                    ▼
              dist/index.html   la landing ya pintada, 25 kB
                    │
                    ▼ en el navegador
              src/main.tsx  ──►  isLanding ? hydrateRoot : createRoot
```

**Por qué una segunda build y no un plugin**: las dos necesitan objetivos
opuestos —una para el navegador, otra para Node— y el HTML que se edita es la
salida de la primera. El bundle de servidor se borra al terminar: es un
artefacto de un artefacto, y dejarlo en `dist/` sería desplegarlo.

**Por qué `entry-server.tsx` no importa `App`**: `App` lee
`window.location.pathname` mientras se carga el módulo, y en Node no hay
`window`. Ese es el precio de dejar el router fuera del chunk de la landing, y
se paga aquí, duplicando el árbol de `/` —`ErrorBoundary` envolviendo
`HomePage`— en catorce caracteres.

**Por qué `main.tsx` mira `isLanding` y no si `#root` tiene hijos**: hay un solo
`index.html` y el hosting lo sirve para todas las rutas, así que `/admins`
recibe la landing horneada dentro de `#root` igual que `/`. Hidratar allí sería
pedirle a React que case la carta contra lo que pinta el router: no casa nunca,
tira el árbol entero y lo repinta. Toda ruta que no sea `/` empieza limpia.

**Los platos no se prerenderizan.** Vienen de Supabase en un efecto, que no
corre en Node, así que lo que queda horneado son los seis `DishCardSkeleton`
—que es lo que el navegador pinta hoy de todas formas, con el tamaño exacto de
las tarjetas reales, así que nada salta cuando llegan.

### Routing y code splitting

`app/App.tsx` no monta ningún router: mira la ruta y decide si hace falta uno.
`app/Router.tsx` declara las rutas y **solo se descarga cuando la ruta no es
`/`**.

```
/                       HomePage                    ← sin router, chunk principal
   ↓ cualquier otra ruta
Router.tsx (lazy)  ─── react-router-dom (14 kB gzip)
/login                  LoginRoute   ─┐
/admins                 AdminRoute   ─┴─ ProtectedRoutes (lazy, mismo chunk)
  /admins               DishesPage      (lazy)
  /admins/platos/nuevo  NewDishPage     (lazy)
  /admins/platos/:id    EditDishPage    (lazy)
  /admins/categorias    CategoriesPage  (lazy)
  /admins/equipo        TeamPage        (lazy)
/404  y  *              NotFoundPage
```

| chunk | tamaño | quién lo descarga |
|---|---|---|
| `index` | 219 kB / 69 kB gzip | todo el mundo |
| `Router` + `react-router-dom` | 40 kB / 14 kB gzip | todo el que no entra por `/` |
| `supabase` | 208 kB / 54 kB gzip | solo quien entra en `/login` o `/admins` |
| `ProtectedRoutes` | 5 kB | ídem |
| páginas del panel | 0,8–2,5 kB c/u | solo la página que se abre |

La carta pública pasó de 135 kB a 69 kB gzip: **−49 %**.

### Por qué el guard vive fuera de `App`

Es la decisión menos obvia del proyecto. Cuando `App` llamaba a `useSession()` y
`useIsAdmin()`, importaba `shared/lib/supabase`, y con él **`supabase-js` entero
entraba en el chunk principal**: 208 kB que todo visitante de la carta se
descargaba para no usarlos nunca. Poner las páginas del panel en `lazy()` no
arreglaba nada, porque el import seguía estando en `App`.

La solución es que **`App` no sepa nada de autenticación**. El control de acceso
vive en `auth/components/ProtectedRoutes.tsx`, que `Router` importa con
`lazy()`.

> **El segundo recorte (04/09/2026)**, el mismo razonamiento un piso más arriba:
> `react-router-dom` estaba en el chunk principal porque `App` lo importaba, y
> la carta no lo usa —es una sola página con anclas—. Ahora `App` mira
> `window.location.pathname` **antes** de importar nada con forma de router.
>
> El precio es una regla nueva y fácil de romper: **ningún componente que pinte
> la carta puede usar `Link`, `useNavigate` ni ningún hook del router**, porque
> en `/` no hay `BrowserRouter` por encima y revientan. Por eso
> `shared/ui/Brand` enlaza a la home con un `<a href="/">`.

> **La comprobación que hay que hacer siempre (03/09/2026).** Esto estuvo roto
> un día: al pasar `useMenu()` a Supabase, `HomePage` volvió a importar el
> cliente y `supabase-js` regresó al primer pintado. **Un solo import mal puesto
> devuelve los 54 kB**, y no se nota mirando la pantalla. Se mira si
> `dist/index.html` lleva un `modulepreload` del chunk de supabase: si aparece,
> alguien lo ha vuelto a importar desde la landing.

`LoginRoute` y `AdminRoute` comparten módulo, y por tanto chunk: entrar por
`/login` y pasar a `/admins` no dispara una segunda descarga.

### El guard, una sola vez

`AdminRoute` está en la **ruta padre**, no en cada hija. Cuando `AdminLayout` se
monta ya se sabe que hay sesión y que es admin, así que ninguna página del panel
repite la comprobación.

```
deciding          → <Spinner />
!session          → /login
!isAdmin          → /404
session && admin  → <AdminLayout session={session} />
```

`/admins/loquesea` cae dentro del layout, no expulsa al admin del panel. Y el
`*` global **renderiza** el 404 en su sitio en vez de redirigir, para conservar
la URL que el usuario escribió.

---

## 6. El acceso a datos

**Hay dos caminos hasta la misma base de datos**, y la diferencia entre ellos es
lo que sostiene el reparto de chunks de §5:

| | la carta pública | el panel |
|---|---|---|
| quién | `menu/hooks/useMenu` | los 7 hooks de `auth/` y `admin/` |
| cómo | `fetch` al endpoint REST de PostgREST | `supabase-js` |
| coste | 0 kB | 54 kB gzip |
| rol | `anon`, sin sesión | `authenticated` |
| tipos | comprobados en ejecución (`rowGuards`) | comprobados al compilar (`Database`) |

Los dos leen las mismas dos tablas y obedecen las mismas políticas de RLS. El
`fetch` no es un atajo: es exactamente lo que la librería habría enviado —dos
`select` anónimos, sin sesión ni realtime— escrito a mano para no pagar la
librería en la página que ve todo el mundo.

### Los tipos salen del esquema, no de la cabeza

```
supabase gen types  ──►  shared/lib/database.types.ts   (generado, no se edita)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
  createClient<Database>()           menu/types.ts  (Pick de las columnas)
  → el panel deja de necesitar             │
    ningún `as Dish[]`                     ▼
                                   menu/rowGuards.ts  (las mismas claves,
                                   comprobadas en ejecución)
```

`rowGuards` no es una tercera copia del esquema: su tipo `Shape<T>` es un mapped
type sobre todas las claves de `T`, así que añadir una columna al tipo y no al
validador **no compila**, y validar una que ya no existe tampoco. Hace falta
solo en `useMenu` porque es el único sitio del proyecto donde entran datos sin
un compilador delante — en todo lo demás, el cliente tipado ya sabe qué devuelve
cada `select`.

**Después de cada migración hay que correr `npm run types:db`.** Es el único
paso manual que queda, y lo que pasa si se olvida es que el código sigue
compilando contra un esquema que ya no existe.

### El patrón de los hooks

Un hook por recurso, seis veces la misma forma:

```ts
const [data, setData] = useState(...)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const controller = new AbortController()
  // ... .abortSignal(controller.signal)
  return () => controller.abort()
}, [deps])
```

El `AbortController` no es decoración: en StrictMode el efecto se monta dos
veces, y sin él dos respuestas compiten por el mismo `setState`.

**Dos sutilezas que costaron un bug cada una:**

`useSession` — `getSession()` y `onAuthStateChange` corren en paralelo y no hay
garantía de cuál termina antes. Si el listener se adelanta, el `.then()` tardío
pisaría la sesión buena con la foto que sacó al empezar. Una bandera hace que el
listener, una vez ha hablado, sea la única fuente de verdad.

`useIsAdmin` — el resultado se guarda **junto al id que se consultó**
(`{ userId, isAdmin }`), no suelto. Sin eso, al cambiar de usuario se daría por
bueno el veredicto del anterior mientras se comprueba el nuevo.

### La foto de un plato: dos escrituras que no son atómicas

Es el único flujo del panel donde algo puede quedar a medias, y por eso el orden
está escrito:

```
DishPhotoField → useDishPhoto.uploadPhoto → shrinkImage → Storage
                                                 │
                                      devuelve un path (uuid.webp)
                                                 ▼
DishForm → useDishes.updateDish → la fila de Postgres apunta al path nuevo
                                                 │
                            y solo entonces se borra el archivo viejo
```

Primero la fila, después el borrado. Al revés —borrar y luego guardar— se pierde
la foto cada vez que el guardado falla. Y `removePhoto` calla si no puede: se le
llama cuando la fila ya está guardada, así que un archivo huérfano cuesta unos
kilobytes, mientras que un error en pantalla le diría al admin que su cambio no
se guardó, y sí se guardó.

### Lo que este patrón no resuelve

**La invalidación.** Se edita un precio en `/admins/platos/7`, se vuelve a la
lista, y la lista muestra el precio viejo porque su `useEffect` no se ha vuelto
a ejecutar. Hoy se resuelve a mano: cada mutación actualiza el estado local con
la fila que devuelve la base de datos, en vez de recargar.

Ya hay una grieta concreta: `useDishes.createDish` hace
`[...previous, created]`, pero la lista se lee ordenada por `category_id,
sort_order` — o sea que un plato nuevo aparece al final hasta que se recarga.

**Ese es el síntoma que indica que toca meter TanStack Query.** No antes: hoy se
pagaría la dependencia y el modelo mental sin cobrar el beneficio.

### Una sola suscripción de auth

`useSession()` abre una suscripción por cada componente que lo llama. Hoy solo
lo llama `ProtectedRoutes`, y solo una de las dos rutas está montada a la vez,
así que hay exactamente una. `useIsAdmin` recibe el `userId` como argumento
precisamente para no abrir una segunda.

Cuando varias pantallas del panel necesiten la sesión, el paso siguiente es un
`SessionContext`: una suscripción, una fuente de verdad, y deja de hacer falta
pasar el `userId` a mano.

---

## 7. Seguridad

La app no tiene backend, así que **la frontera de seguridad es Postgres**.

### El molde

```sql
-- La pieza clave: security definer, search_path vacío, auth.uid() envuelto
create function private.is_admin() returns boolean
  language sql stable security definer set search_path to ''
as $$ select exists (
  select 1 from public."Admins" where user_id = (select auth.uid())
) $$;
```

Toda tabla nueva usa las mismas dos políticas: lectura pública de lo publicado,
escritura solo admin. `anon` lee los platos disponibles, no ve los ocultos, y
no ve `Admins` en absoluto.

### Qué se comprueba dónde

| comprobación | dónde vive | por qué |
|---|---|---|
| ¿hay sesión? | React (`useSession`) | solo decide qué pintar |
| ¿es admin? | React **y** RLS | React redirige; RLS es quien manda |
| ¿puede dar de alta a un admin? | **solo SQL** (`add_admin`) | el cliente es manipulable |

`add_admin(email)` es `security definer` por dos motivos: `authenticated` no
puede leer `auth.users` para traducir correo → `user_id`, y la tabla `Admins`
no tiene política de `insert`. Por eso **lo primero que hace es comprobar quién
llama**.

Registrarse **no** da acceso al panel. Hubo un trigger que creaba una fila en
`Admins` por cada alta en `auth.users` — es decir, registro público = panel
público. Se eliminó; ahora el alta la da un admin a mano.

### El SEO vive en el HTML, no en React

`landing/seo.ts` construye la descripción, las etiquetas Open Graph y la ficha
JSON-LD del negocio, y un plugin de `vite.config.ts` las escribe en
`index.html`. **Tiene que ser así**: Google, WhatsApp y Facebook leen el HTML
que descargan, y esta app pinta todo desde JavaScript — unas etiquetas puestas
por React llegan tarde para los únicos que las leen.

Los datos salen de `content.ts`, no se reescriben: un restaurante cuyo horario
real y cuyo horario en Google no coinciden está peor que uno que nunca lo
publicó.

El mismo plugin escribe el `<title>`, las metas `geo.*`, el `robots` y un
`preconnect` a Supabase — la carta pide los platos nada más pintar, así que la
conexión se abre mientras baja el JavaScript. `public/robots.txt` deja `/admins`
y `/login` fuera del rastreo.

Lo que necesita URL absoluta (`og:url`, `og:image`, el `canonical` y el `url`
de la ficha) se escribe **solo si `VITE_SITE_URL` tiene valor**. Mientras no
haya dominio se omite a propósito: una URL equivocada rompe la vista previa para
todo el mundo, y una ausente no.

Un tercer plugin emite `llms.txt` en la raíz del sitio: el mismo problema y un
lector distinto. Es Markdown, y le da a un modelo el horario, la dirección, el
teléfono y cómo se encarga, en texto plano. También se genera desde
`content.ts` y por el mismo motivo — una tercera copia del horario es la que se
queda vieja. Los platos no están: viven en Supabase y cambian, así que el
archivo remite a la página. Se sirve igual en `npm run dev` que en el build,
para poder mirarlo sin compilar.

### Las fuentes son del propio dominio

Anton, Space Grotesk y Space Mono se sirven desde `public/fonts` con sus
`@font-face` al principio de `src/index.css`, y las dos que hacen falta para el
primer pintado se precargan desde `index.html`.

Antes venían de Google Fonts con un `<link rel="stylesheet">`, que cuesta tres
cosas: la hoja bloquea el pintado, hay que abrir conexión con dos dominios más
antes de saber siquiera qué archivos pedir, y el titular saltaba al llegar Anton
—el grueso del CLS—. De propina, la CSP ya no necesita permitir ningún dominio
de Google ni en `style-src` ni en `font-src`.

### La CSP

`vite.config.ts` inyecta una Content-Security-Policy en el HTML **solo en el
build** (en desarrollo Vite necesita websockets e inline scripts para el HMR).

Es una segunda línea de defensa: la primera es que React escapa todo lo que
interpola. Importa más de lo que parece porque **supabase-js guarda el token de
sesión en localStorage**: un XSS aquí no es un `alert()`, es robar la sesión de
un admin y con ella la capacidad de escribir en la base de datos. Por eso
`script-src 'self'` sin `unsafe-inline` ni `unsafe-eval`, `style-src 'self'`
—también sin `unsafe-inline`, ver docs/seguridad.md— y `connect-src` limitado a
Supabase.

Dos excepciones, las dos con nombre y apellidos: `script-src` lleva el hash
`sha256` del bloque JSON-LD —para la CSP es un `<script>` aunque solo contenga
datos—, y `frame-src` nombra `https://www.google.com`, que es el único sitio que
puede empotrarse en la página, por el mapa de `LocationSection`. Estuvo en
`'none'` seis días con el mapa roto en producción: **una directiva que solo se
aplica en el build es una directiva que nadie prueba**, y por eso `npm run
preview` tiene que entrar en la rutina antes de cada release.

### Storage

El bucket `dishes` es **público a propósito**. Las fotos de una carta son tan
públicas como los precios que tienen al lado, y un bucket privado obligaría a
firmar cada URL: una URL firmada caduca, y una carta cuyas fotos dejan de cargar
al cabo de una hora es peor que no tener fotos. Lo que se protege es la
escritura, con el mismo molde de dos políticas que las tablas.

Los límites del bucket —1 MB y solo `image/webp`— son la segunda línea, no la
primera: el panel encoge cada foto antes de subirla (`admin/lib/shrinkImage.ts`).
Están para el día que alguien suba con `curl` y no haya navegador que encoja
nada.

### Dos trampas del proyecto

1. **El event trigger `ensure_rls`** activa RLS en toda tabla nueva de
   `public`. Es una red de seguridad excelente, pero significa que una tabla
   recién creada **devuelve cero filas hasta que tiene políticas**. Síntoma:
   creas `dishes`, insertas tres filas, haces el `select` desde la app y ves
   una lista vacía. No está rota; le faltan las políticas.
2. **Los `alter default privileges`** de la primera migración conceden
   `insert/update/delete` a `anon` sobre toda tabla futura de `public`. El RLS
   lo tapa, pero eso deja una sola capa de defensa. En cada tabla nueva,
   `revoke` explícito, como se hizo con `Admins`.

### Migraciones

> **Corregido el 05/09/2026.** Este apartado decía que los archivos no llevaban
> prefijo de timestamp y que se aplicaban a mano desde el SQL Editor. Dejó de ser
> verdad con la tarea 9, el 01/09/2026, y aquí siguió escrito cuatro días.

Los ocho archivos de `supabase/migrations/` llevan prefijo de timestamp UTC, que
es lo que espera el CLI, y se aplican con **`npx supabase db push --linked`**:

```
20260825235901_admins_rls.sql                    la tabla Admins y sus políticas
20260826000258_admins_signup_trigger.sql         el trigger de alta automática
20260826094521_admins_aprobacion_manual.sql      ...y su retirada
20260826100433_seguridad_permisos_por_defecto.sql  ensure_rls y los grants
20260831093559_admins_rename_add_admin.sql       la función add_admin
20260902204529_menu_tables.sql                   categories y dishes, enteras
20260902212555_drop_plates.sql                   la tabla huérfana            ⏳
20260904120000_dish_photos_storage.sql           el bucket y sus políticas    ⏳
```

⏳ **Las dos últimas están escritas y sin aplicar** (tarea 17 de
`docs/nextTasks.md`). No es un despiste que se vea a simple vista: nada en el
repo ni en el CI comprueba que la base de datos vaya al día con la carpeta. Lo
que sí lo delata es `database.types.ts`, que se genera del esquema **real** — si
contiene `plates`, la migración que la borra sigue sin aplicarse.

Cada migración trae **sus propias políticas y sus grants en el mismo archivo**.
No es orden: el event trigger `ensure_rls` enciende RLS en toda tabla nueva, así
que una tabla sin políticas devuelve cero filas a todo el mundo. Partir una
migración en dos hace alcanzable ese estado a medias.

---

## 8. Qué comprueba el proyecto, y qué no

Cuatro comandos, y el CI corre los tres primeros en este orden sobre cada PR y
cada push a `main`:

| comando | qué mira | cuándo falla |
|---|---|---|
| `npm run lint` | ESLint: reglas de React Hooks y typescript-eslint | lo primero, es lo más barato |
| `npm run format:check` | Prettier, versión fijada exacta | idem; se arregla con `npm run format` |
| `npm run build` | `tsc -b`, el bundle y el prerenderizado | lo último, es lo más lento |
| `npm run types:db` | **no está en el CI**: regenera los tipos del esquema | a mano, después de cada migración |

El `build` del CI recibe dos variables de relleno. No es un adorno: Vite
sustituye `import.meta.env.VITE_*` **en tiempo de build**, así que construir sin
ellas no produce una app que las leerá luego, produce una app con `undefined`
incrustado; los dos puntos de entrada a Supabase se niegan a construir en ese
estado.

**Lo que no comprueba nadie**, y conviene saberlo antes de confiar en el verde:

- **No hay ni un test.** El primero que merece la pena está identificado desde
  hace días: `menu/formatPrice.ts`, que es puro, no toca React y es donde un
  error cuesta dinero.
- **Nada mira Supabase.** Ni que las migraciones estén aplicadas, ni que las
  políticas hagan lo que dicen.
- **Nada impide que vuelvan los 54 kB.** Que la landing no importe
  `supabase-js` es una regla escrita en §5 y sostenida por la atención de quien
  revisa, no por una comprobación.
- **Nada impide un `style={{ … }}`**, que rompería `style-src 'self'` en
  silencio y solo en producción.

Las cuatro son la misma frase: **este repo convierte muy bien las decisiones en
comentarios, y todavía no las convierte en comprobaciones.**

---

## 9. Estilos

Tailwind v4, sin `tailwind.config.js`: el tema se declara en CSS.

`src/index.css` define la paleta completa dentro de `@theme static`. El
`static` es necesario: sin él Tailwind elimina los tokens que ningún utility
usa todavía, y un `var(--color-cream)` escrito a mano no resolvería. Cuesta
unos 400 bytes y mantiene la paleta como referencia entera del proyecto.

Las animaciones (`--animate-jump`, `--animate-heartbeat`) también son tokens
del tema; sus `@keyframes` **tienen que vivir dentro del `@theme`** para que el
token resuelva.

Convenciones:

- Los breakpoints se escriben `max-[900px]:` / `max-[560px]:`, de escritorio
  hacia abajo, porque el diseño nació así.
- Los valores arbitrarios (`text-[3.75rem]`) son deliberados: la escala
  tipográfica del cartel no encaja en la de Tailwind.
- Lo que se repite en varios archivos sube a `shared/ui`; lo que es de un solo
  componente se queda como constante arriba del archivo (`CELL`, `DAY_NAME`).

Accesibilidad ya resuelta: un solo `h1` (en `HeroSection`), foco visible en
rojo de marca, `prefers-reduced-motion` en el scroll y en el spinner, iconos
`aria-hidden` con el nombre accesible en el enlace, y la banda roja decorativa
oculta a lectores de pantalla.

---

## 10. Idioma

**El código está en inglés; lo que ve el cliente está en español.**

| en inglés | en español |
|---|---|
| archivos, componentes, funciones, variables, tipos | textos de la UI |
| comentarios | mensajes de error del panel |
| tablas y columnas de la base de datos | rutas (`/admins/platos/nuevo`) |
| | anclas (`#la-carta`) |

Las rutas y las anclas se quedan en español a propósito: son direcciones que el
usuario ve en la barra y que romperían enlaces guardados. Están centralizadas
en `app/Router.tsx` y `landing/content.ts` por si algún día se cambia de idea.

Las cuatro migraciones SQL anteriores a `20260831093559_admins_rename_add_admin.sql`
conservan sus nombres y comentarios en español: son el registro de lo que ya
está aplicado en la base de datos, y reescribirlas haría que dejaran de
describir la realidad. Todas llevan delante el prefijo de timestamp UTC que
espera `supabase db push`, tomado de la fecha del commit que las creó.

---

## 11. Cuándo romper esta arquitectura

Ninguna de estas piezas es sagrada. Las señales que indican que toca cambiar:

| señal | movimiento |
|---|---|
| Una lista muestra datos viejos tras editarlos en otra pantalla | TanStack Query |
| Tres pantallas del panel necesitan la sesión | `SessionContext` |
| `shared/ui` pasa de ~10 componentes | subdividir por tipo |
| Un componente de `shared/` necesita tipos de una feature | no es shared: muévelo |
| Una feature tiene más de ~15 archivos | subdividir dentro de la feature |
| Un plato nuevo aparece en el sitio equivocado de la lista | TanStack Query (ya está pasando) |
| La landing necesita una segunda página de verdad | volver a meter el router en el chunk principal |
| Un `as` vuelve a aparecer sobre datos de Supabase | falta `npm run types:db` |

Lo que **no** conviene hacer por adelantado: crear la carpeta de una feature
que aún no existe, o meter una librería de estado antes de tener el problema
que resuelve.

---

## Ver también

- `docs/panel.md` — decisiones del panel y modelo de datos con el DDL
- `docs/cleanCode.md` — pautas de estilo y deuda pendiente
- `docs/nextTasks.md` — trabajo pendiente por orden de prioridad
- `docs/seguridad.md` — notas de seguridad
- `docs/panel-a-mano.md` — el panel explicado a quien lo usa
- `README.md` — puesta en marcha y comandos
