# Arquitectura del proyecto

Cómo está montado el Asador El Casar y por qué. Documento de referencia: si
algo aquí se contradice con el código, gana el código — pero conviene
actualizar esto.

Actualizado el 31/08/2026. 48 archivos de código en `src/`, 1.806 líneas de TypeScript.

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

Comparten base de datos y cliente de Supabase. **No comparten layout, ni
navegación, ni bundle** (ver §5).

El principio que separa las dos: *el panel puede ser feo; la carta no*. El
esfuerzo de diseño va al lado público; el panel solo tiene que ser difícil de
romper.

---

## 3. Distribución de archivos

Agrupada **por dominio, no por tipo de archivo**: lo que se toca junto vive
junto. Añadir un campo a un plato toca `features/menu/` y nada más.

```
asadorElCasarv1/
├── index.html                  fuentes de Google, meta referrer, #root
├── vite.config.ts              React + Tailwind + plugins de SEO y CSP
├── eslint.config.js
├── tsconfig.{json,app,node}.json
├── .env                        no se sube (VITE_SUPABASE_URL, ..._PUBLISHABLE_KEY)
├── .env.example                plantilla sin secretos
│
├── public/                     favicon.svg, icons.svg
│
├── docs/
│   ├── arquitectura.md         este archivo
│   ├── panel.md                decisiones del panel y del modelo de datos
│   ├── nextTasks.md            trabajo pendiente por prioridad
│   ├── seguridad.md            notas de seguridad
│   ├── panel-a-mano.md
│   └── aplicar-migraciones.sql
│
├── supabase/
│   ├── config.toml
│   └── migrations/             SQL aplicado a mano desde el SQL Editor
│
└── src/
    ├── main.tsx                createRoot + StrictMode. 10 líneas.
    ├── index.css               @theme de Tailwind v4: la paleta entera
    ├── assets/                 logo.jpg, hero.png
    │
    ├── app/
    │   └── App.tsx             router, guards y code splitting. Nada más.
    │
    ├── features/               ← un directorio por dominio
    │   ├── landing/            la web pública
    │   ├── menu/               la carta (datos + tipos)
    │   ├── auth/               sesión, login y control de acceso
    │   └── admin/              el panel
    │
    └── shared/                 ← lo que usan dos o más features
        ├── components/ui/      lenguaje visual
        ├── components/icons/   iconos SVG
        ├── components/Spinner.tsx
        ├── lib/supabase.ts     el cliente, instanciado una vez
        └── pages/NotFoundPage.tsx
```

### `src/features/landing/` — la web pública

```
content.ts                  todos los textos y datos de contacto
seo.ts                      título, descripción, vista previa, geo y JSON-LD
pages/HomePage.tsx          solo compone secciones (47 líneas)
components/
  SiteHeader.tsx            banda de tinta: marca, menú, teléfono
  HeroSection.tsx           el único <h1> de la web
  MarqueeBand.tsx           banda roja de reclamos (aria-hidden)
  MenuSection.tsx           la carta en cuadrícula, por categorías ← useMenu()
  DishCard.tsx              un plato: foto (o su marco), nombre y precio
  AboutSection.tsx          "sobre nosotros"
  ScheduleSection.tsx       horario semanal, 8 celdas
  OrderSection.tsx          bloque de tinta: reservas y los 3 pasos
  LocationSection.tsx       datos + iframe de Google Maps (lazy)
  SiteFooter.tsx            marca, menú repetido, contacto
  SocialLinks.tsx           Instagram, Facebook, teléfono
```

**`content.ts` existe para que el teléfono se escriba una vez.** Aparece en la
cabecera, en el pie, en la chapa del hero y en ubicación: repetirlo garantiza
que algún día uno se quede sin actualizar.

**Las secciones no traen ni el `grid` ni el ancho.** Eso lo pone `HomePage`,
que es lo que permite reordenar la página moviendo una línea sin tocar ninguna
sección.

### `src/features/menu/` — la carta

```
types.ts           Dish y Category = columnas de las tablas de Supabase
formatPrice.ts     1250 ↔ "12,50 €" / "12,50" (los dos sentidos)
dishPhoto.ts       photo_path → URL pública del bucket (sin bucket todavía)
hooks/useMenu.ts   la única puerta a los datos de la carta
```

> **Actualizado (02/09/2026, tarea 8.3).** El cambio anunciado aquí ya está
> hecho: `useMenu()` lee las tablas `dishes` y `categories` de Supabase y
> `data/menu.json` ya no existe. La apuesta salió bien —la firma de retorno era
> la definitiva, así que no hubo que cambiar los tipos ni la forma del hook— con
> una excepción anotada en `docs/nextTasks.md` §8: `MenuSection` sí hubo que
> tocarlo, porque no miraba `loading` ni `error` pese a lo que promete el tercer
> punto de abajo.

Es la pieza mejor preparada del proyecto. Lee las tablas `dishes` y
`categories` de Supabase, **y toda esa lectura vive dentro de `useMenu.ts`**.
Por eso:

- Los tipos son exactamente las columnas de las tablas. Nada de
  `price: "12,00 €"`: el precio va en céntimos (`price_cents: number`), como
  en la base de datos.
- `useMenu()` devuelve `{ dishes, categories, loading, error }`. Desde que lee
  de la red, `loading` empieza siendo `true` de verdad y `error` puede traer el
  mensaje de Supabase.
- El filtro de `available` ya no está en el cliente: lo hace la política de RLS,
  y los platos fuera de carta no llegan siquiera al navegador. El panel, que sí
  los necesita, los ve por su propia política (`admin/hooks/useDishes.ts`).
- El orden viene de `.order('sort_order')`, y la carta se agrupa por
  `categories.sort_order` —no por `category_id`, que la base de datos asigna
  según entran las filas.

### `src/features/auth/` — sesión y acceso

```
hooks/useSession.ts          ¿hay sesión? { session, loading }
hooks/useIsAdmin.ts          ¿tiene fila en Admins? { isAdmin, loading }
hooks/useAuth.ts             signUp / signIn / signOut + estado de envío
components/LoginForm.tsx     el formulario
components/ProtectedRoutes.tsx  LoginRoute y AdminRoute ← el guard
pages/LoginPage.tsx
```

### `src/features/admin/` — el panel

```
components/AdminLayout.tsx   navegación + correo + cerrar sesión
components/AdminHeading.tsx  el título de página del panel
components/AdminInput.tsx    el input, y ADMIN_FIELD_CLASS para textarea/select
components/AdminButton.tsx   el botón: primary y quiet
components/AdminField.tsx    etiqueta + campo debajo
components/DishForm.tsx      el formulario, compartido por el alta y la edición
hooks/useAdmins.ts           lista de admins y alta de nuevos
hooks/useDishes.ts           platos: la lista completa, con los no disponibles
hooks/useCategories.ts       categorías: lista, alta, orden y borrado
pages/DishesPage.tsx         lista de platos con el interruptor de la carta
pages/NewDishPage.tsx        alta de plato
pages/EditDishPage.tsx       edición de plato, y el borrado tras confirmación
pages/CategoriesPage.tsx     categorías y orden
pages/TeamPage.tsx           alta de admins
```

Las cinco páginas funcionan desde el 02/09/2026 (tarea 8). Los cuatro
componentes `Admin*` son la respuesta a `docs/cleanCode.md` §1: el panel puede
ser feo, pero su estilo tiene que estar en un solo sitio.

### `src/shared/` — lo genuinamente compartido

```
components/ui/tokens.ts       POSTER_BORDER, POSTER_SHADOW, PAGE_CONTAINER
components/ui/Button.tsx      3 variantes: red, paper, ghost
components/ui/Tag.tsx         etiqueta mono de sección
components/ui/PhotoFrame.tsx  hueco de foto con trama diagonal
components/ui/Heading.tsx     Heading y SectionHeading
components/ui/Lead.tsx        párrafo de entrada
components/ui/Brand.tsx       logo + nombre, enlaza a "/"
components/icons/             IconBase + Phone, WhatsApp, Instagram, Facebook
components/Spinner.tsx        carga a pantalla completa
lib/supabase.ts               createClient(), una sola vez en toda la app
pages/NotFoundPage.tsx
```

En el CSS original `Button`, `Tag` y `PhotoFrame` eran clases (`.btn`, `.tag`,
`.photo`). En Tailwind esas cadenas son largas y se repetían en cinco archivos,
así que son componentes: **un único sitio donde tocarlas**.

`IconBase` fija la caja 24×24 y `aria-hidden`, y los trazos usan
`currentColor`: por eso el mismo icono sirve en la cabecera (blanco sobre rojo)
y en el pie (papel sobre tinta) sin variantes.

---

## 4. La regla de dependencias

Una sola, y es la que mantiene el orden:

```
app/  ──►  features/*  ──►  shared/
                │
                └──►  otra feature, solo hacia abajo en la jerarquía
```

- **`shared/` no importa nada de `features/`.** Si un componente de `shared/`
  necesita saber del dominio, no es compartido: es de esa feature.
- **Las features no se importan entre sí en horizontal**, salvo dos cruces
  deliberados y documentados:
  - `landing/MenuSection` → `menu/useMenu` (la carta se pinta en la landing).
  - `auth/ProtectedRoutes` → `admin/AdminLayout` (el guard decide qué monta).
- **`app/` solo conoce las páginas.** No importa hooks, ni `supabase`, ni
  nada de dominio. Esto no es estética: es lo que mantiene el bundle partido
  (§5).

Si un import rompe la regla, la respuesta suele ser mover la pieza a `shared/`,
no añadir la excepción.

---

## 5. Routing y code splitting

`app/App.tsx`, 59 líneas, hace tres cosas: montar el router, declarar las rutas
y decidir qué se carga aparte.

```
/                       HomePage                    ← en el bundle principal
/login                  LoginRoute   ─┐
/admins                 AdminRoute   ─┴─ ProtectedRoutes (lazy, mismo chunk)
  /admins               DishesPage      (lazy)
  /admins/platos/nuevo  NewDishPage     (lazy)
  /admins/platos/:id    EditDishPage    (lazy)
  /admins/categorias    CategoriesPage  (lazy)
  /admins/equipo        TeamPage        (lazy)
/404  y  *              NotFoundPage
```

### Por qué el guard vive fuera de `App`

Es la decisión menos obvia del proyecto y merece explicarse.

Cuando `App` llamaba a `useSession()` y `useIsAdmin()`, importaba
`shared/lib/supabase`, y con él **`supabase-js` entero entraba en el chunk
principal**: 208 kB que todo visitante de la carta se descargaba para no
usarlos nunca. Poner las páginas del panel en `lazy()` no arreglaba nada,
porque el import seguía estando en `App`.

La solución es que **`App` no sepa nada de autenticación**. El control de
acceso vive en `features/auth/components/ProtectedRoutes.tsx`, que `App`
importa con `lazy()`. Resultado:

| chunk | tamaño | quién lo descarga |
|---|---|---|
| `index` | 248 kB / 79 kB gzip | todo el mundo |
| `jsx-runtime` | 8 kB / 3 kB gzip | todo el mundo |
| `supabase` | 208 kB / 54 kB gzip | solo quien entra en `/login` o `/admins` |
| `ProtectedRoutes` | 5 kB | ídem |
| páginas del panel | 0,8–2,5 kB c/u | solo la página que se abre |

La carta pública pasó de 135 kB a 82 kB gzip: **−39 %**.

> **Actualizado (03/09/2026).** Esto estuvo roto un día: al pasar `useMenu()` a
> Supabase (tarea 8.3), `HomePage` volvió a importar el cliente y `supabase-js`
> regresó al primer pintado de la carta. La salida ya estaba escrita aquí y es
> la que se tomó: **la carta pública pide sus dos tablas con `fetch` al endpoint
> REST**, que es exactamente lo que la librería habría enviado —dos `select`
> anónimos, sin sesión ni realtime—, y el cliente se queda para el panel.
>
> Con ello se fue también un import escondido: `menu/dishPhoto.ts` importaba el
> cliente solo para componer una URL de Storage con `getPublicUrl`, que no hace
> ninguna petición. Ahora la compone a mano. **Un solo import mal puesto
> devuelve los 54 kB**, así que la comprobación es mirar si `dist/index.html`
> lleva un `modulepreload` del chunk de supabase: si aparece, alguien lo ha
> vuelto a importar desde la landing.

`LoginRoute` y `AdminRoute` comparten módulo, y por tanto chunk: entrar por
`/login` y pasar a `/admins` no dispara una segunda descarga.

### El guard, una sola vez

`AdminRoute` está en la **ruta padre**, no en cada hija. Cuando `AdminLayout`
se monta ya se sabe que hay sesión y que es admin, así que ninguna página del
panel repite la comprobación.

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

Un hook por recurso. El patrón se repite igual en los tres:

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
pisaría la sesión buena con la foto que sacó al empezar. Una bandera
`listenerHasSpoken` hace que el listener, una vez ha hablado, sea la única
fuente de verdad.

`useIsAdmin` — el resultado se guarda **junto al id que se consultó**
(`{ userId, isAdmin }`), no suelto. Sin eso, al cambiar de usuario se daría por
bueno el veredicto del anterior mientras se comprueba el nuevo.

### Lo que este patrón no resuelve

**La invalidación.** Se edita un precio en `/admins/platos/7`, se vuelve a la
lista, y la lista muestra el precio viejo porque su `useEffect` no se ha vuelto
a ejecutar. Hoy se resuelve a mano (`useAdmins.addAdmin` actualiza el estado
local en vez de recargar). Con tres pantallas es llevadero; con diez es una
fuente constante de bugs sutiles.

**Ese es el síntoma que indica que toca meter TanStack Query.** No antes: hoy
se pagaría la dependencia y el modelo mental sin cobrar el beneficio.

### Una sola suscripción de auth

`useSession()` abre una suscripción por cada componente que lo llama. Hoy solo
lo llama `useAccess()` dentro de `ProtectedRoutes`, y solo una de las dos rutas
está montada a la vez, así que hay exactamente una. `useIsAdmin` recibe el
`userId` como argumento precisamente para no abrir una segunda.

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
`script-src 'self'` sin `unsafe-inline` ni `unsafe-eval`, y `connect-src`
limitado a Supabase.

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

Los archivos de `supabase/migrations/` **no llevan prefijo de timestamp**, así
que `supabase db push` no los reconoce: se aplican pegándolos en el SQL Editor.
O se mantiene esa costumbre, o se renombran todos y se pasa al CLI. Lo que no
conviene es mezclar las dos cosas (tarea 9 de `docs/nextTasks.md`).

---

## 8. Estilos

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

## 9. Idioma

**El código está en inglés; lo que ve el cliente está en español.**

| en inglés | en español |
|---|---|
| archivos, componentes, funciones, variables, tipos | textos de la UI |
| comentarios | mensajes de error del panel |
| tablas y columnas de la base de datos | rutas (`/admins/platos/nuevo`) |
| | anclas (`#la-carta`) |

Las rutas y las anclas se quedan en español a propósito: son direcciones que el
usuario ve en la barra y que romperían enlaces guardados. Están centralizadas
en `app/App.tsx` y `landing/content.ts` por si algún día se cambia de idea.

Las cuatro migraciones SQL anteriores a `20260831093559_admins_rename_add_admin.sql`
conservan sus nombres y comentarios en español: son el registro de lo que ya
está aplicado en la base de datos, y reescribirlas haría que dejaran de
describir la realidad. Todas llevan delante el prefijo de timestamp UTC que
espera `supabase db push`, tomado de la fecha del commit que las creó.

---

## 10. Cuándo romper esta arquitectura

Ninguna de estas piezas es sagrada. Las señales que indican que toca cambiar:

| señal | movimiento |
|---|---|
| Una lista muestra datos viejos tras editarlos en otra pantalla | TanStack Query |
| Tres pantallas del panel necesitan la sesión | `SessionContext` |
| `shared/ui` pasa de ~10 componentes | subdividir por tipo |
| Un componente de `shared/` necesita tipos de una feature | no es shared: muévelo |
| Una feature tiene más de ~15 archivos | subdividir dentro de la feature |
| Un `throw` en render deja pantalla en blanco | `ErrorBoundary` (tarea 10) |

Lo que **no** conviene hacer por adelantado: crear la carpeta de una feature
que aún no existe, o meter una librería de estado antes de tener el problema
que resuelve.

---

## Ver también

- `docs/panel.md` — decisiones del panel y modelo de datos con el DDL
- `docs/nextTasks.md` — trabajo pendiente por orden de prioridad
- `docs/seguridad.md` — notas de seguridad
- `README.md` — puesta en marcha y comandos
