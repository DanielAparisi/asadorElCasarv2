# Próximas tareas

Lista de trabajo ordenada por prioridad, salida de la revisión técnica del
30/08/2026. El criterio del orden es *qué desbloquea más por menos esfuerzo*,
no la gravedad aislada de cada punto.

Estado del repo en el momento de escribir esto: `npm run build` pasa (469 kB /
135 kB gzip en un único chunk) y `npm run lint` sale limpio.

> **Actualización 31/08/2026.** Hechas las tareas 1, 2, 3, 5, 6 y 7. Además, el
> código se pasó entero a inglés y se reorganizó por dominios
> (`features/` + `shared/`), así que las rutas de archivo citadas más abajo en
> las tareas pendientes son las de antes del refactor. La equivalencia está en
> el README. Queda pendiente aplicar
> `supabase/migrations/20260831093559_admins_rename_add_admin.sql` en el SQL
> Editor: el cliente ya llama a `add_admin`.
>
> **Actualización 01/09/2026.** Hechas también las tareas 9 y 10. Quedan
> pendientes la 4 (despliegue), la 8 (tablas `dishes`/`categories`) y el aviso
> de precios de la 7, que cae solo al hacer la 8. Son unas 5 h en total.
>
> La 8 se ha desglosado en siete partes (8.1–8.7) porque era la única que no
> cabía en un rato: cada una deja el repo compilando y algo que enseñar, y el
> orden entre ellas no es negociable.

Las tres primeras son media mañana entre las tres. La 8 es la que convierte el
panel en algo realmente usable.

---

## 1. `carta.json` miente sobre su tipo — ✅ HECHO (31/08/2026)

**~15 min · bug latente**

Ningún plato del JSON tiene el campo `orden`, pero `type Plato` lo declara
obligatorio y el `carta.platos as Plato[]` de `src/hooks/useCarta.ts:57` silencia
el error de TypeScript.

Consecuencia: el comparador hace `undefined - undefined` → `NaN`, devuelve 0, y
el orden de los platos dentro de cada categoría acaba siendo accidental (el del
array). Hoy no se nota porque el JSON ya está en el orden deseado; se notará el
día que alguien reordene.

- [x] Añadir `orden` a los 6 platos de `src/lib/carta.json`
- [x] Quitar el `as Plato[]` para que TypeScript vuelva a vigilar la forma

Comprobado quitando `orden` a un plato: `tsc` ahora falla con TS18048
(«'a.orden' is possibly 'undefined'») en vez de pasar en silencio.

---

## 2. La home pública espera al chequeo de auth — ✅ HECHO (31/08/2026)

**~30 min · rendimiento percibido**

`src/App.tsx:22` devuelve `<Spinner />` para **todas** las rutas mientras se
resuelven la sesión y el `esAdmin`. Un visitante anónimo ve un spinner mientras
se lee localStorage, antes de que se pinte la carta. Es la ruta que más tráfico
tiene y la que peor arranca.

- [x] Mover el gate de carga dentro de las rutas que de verdad lo necesitan
      (`/login` y `/admins`)
- [x] Dejar que `/` renderice de inmediato, sin esperar a auth

El control de acceso salió de `App.tsx` a `src/components/rutasPrivadas.tsx`
(`RutaLogin` y `RutaAdmins`). El guard sigue en la ruta padre, no en cada hija.
Sigue habiendo una única suscripción de auth: solo una de las dos rutas está
montada a la vez.

---

## 3. Partir el bundle — ✅ HECHO (31/08/2026)

**~20 min · rendimiento**

469 kB (135 kB gzip) en un solo chunk: todo visitante de la carta se descarga el
panel de administración y `@supabase/auth-js` sin usarlos nunca.

- [x] `React.lazy()` sobre las páginas de `/admins`
- [x] `<Suspense fallback={<Spinner />}>` envolviendo la rama del panel
- [x] Verificar la reducción con `npm run build`

Con solo las páginas en `lazy()` la home bajaba 6 kB: `App.tsx` importaba
`useSession`/`useEsAdmin`, así que `supabase-js` seguía en el chunk principal.
Sacar el guard a un módulo lazy (ver tarea 2) es lo que de verdad lo movió.

| | antes | después |
|---|---|---|
| chunk de la home | 469,6 kB / 135,5 kB gzip | **254,0 kB / 80,5 kB gzip** |
| `supabaseClient` | — | 208,2 kB / 53,8 kB (solo rutas privadas) |
| chunks del panel | — | 7 chunks, 0,3–5 kB cada uno |

−41 % gzip en la carta pública. Verificado además que el chunk principal ya no
contiene código de Supabase, solo la URL del import dinámico.

---

## 4. Configuración de despliegue (falta entera)

**~30 min · bloqueante para producción**

No hay `vercel.json`, `netlify.toml` ni `_redirects` en el repo. Sin rewrite de
SPA, recargar en `/admins/equipo` devuelve el 404 del hosting, no la página de
la app.

- [ ] Añadir el rewrite SPA (todo a `/index.html`) del hosting elegido
- [ ] Cabecera `X-Robots-Tag: noindex` para `/admins/*` y `/login`
- [ ] Poner el dominio en `VITE_SITE_URL` (la variable del hosting, y el `.env`
      local). Sin ella, la tarea 12 deja fuera `og:url`, el `canonical` y la
      imagen absoluta de la vista previa

El comentario de `index.html:9` da por hecho que el noindex "se controla por
ruta desde el hosting", pero ese hosting todavía no está configurado.

---

## 5. Race en `useSession` — ✅ HECHO (31/08/2026)

**~10 min · corrección**

`getSession()` y `onAuthStateChange` corren en paralelo
(`src/hooks/useSession.ts:19-26`). Si el callback del listener se adelanta, el
`.then()` tardío lo pisa con un valor viejo.

- [x] Escribir la sesión inicial solo si aún no ha llegado ningún evento, o
      reordenar para que la última escritura sea siempre la del listener

Resuelto con una bandera `mandaElListener`: en cuanto `onAuthStateChange` habla,
el `.then()` de `getSession()` ya no pisa su valor. El listener pone además
`cargando` a false, para no quedarse colgado en el spinner si `getSession()` se
atasca teniendo ya la respuesta.

---

## 6. `PRIVATE_API_KEY` fuera del `.env` — ✅ HECHO (31/08/2026)

**~5 min · higiene de seguridad**

`.env` está correctamente ignorado por git, pero una clave privada en un
proyecto 100 % cliente no tiene dónde usarse sin acabar filtrada en el bundle.

- [x] Eliminar `PRIVATE_API_KEY` de `.env`
- [x] Si algún día hace falta, va en una Edge Function, nunca en el cliente
- [x] Añadido `.env.example` con las dos variables `VITE_` y sin secretos — el
      `.gitignore` ya lo tenía previsto (`!.env.example`) pero el archivo no
      existía. **Revertido después**: el archivo se eliminó y las variables
      pasaron a documentarse en el README, que es lo que se lee antes de
      arrancar. La negación `!.env.example` salió del `.gitignore` con él

No había ningún uso de `PRIVATE_API_KEY` en el código.

---

## 7. Limpieza y detalles — ✅ HECHO salvo el aviso de precios (31/08/2026)

**~30 min**

- [x] Borrar `src/App.css` (está vacío, sin referencias)
- [x] Borrar `src/assets/react.svg` y `src/assets/vite.svg` (sin referencias)
- [x] `Marca` usa `href="#"` (`src/components/ui.tsx:147`): desde `/404` no
      vuelve al inicio. Debería ser `<Link to="/">`
- [ ] **PENDIENTE** — Quitar el aviso «Precios de ejemplo — sustituir por los
      reales» (`src/features/landing/components/MenuSection.tsx`) cuando los precios sean los buenos

Se deja puesto a propósito: los precios de `carta.json` siguen siendo de
ejemplo (pollo entero a 12,00 €). Quitar el aviso antes que los precios falsos
es peor que dejarlo, porque convierte un marcador visible en un precio que
parece real. Se cae solo al hacer la tarea 8, cuando la carta salga de Supabase
con los precios del asador.

---

## 8. La carta desde Supabase — ✅ HECHO salvo los datos reales (02/09/2026)

**~5 h repartidas en 7 partes · cada una deja algo que funciona**

> **Estado (02/09/2026).** 8.1 y de la 8.3 a la 8.7 están hechas y aplicadas
> contra el proyecto de Supabase (`supabase db push`). Queda pendiente **la
> 8.2**: la carta que hay dentro son todavía los datos de ejemplo del antiguo
> `menu.json`, así que el aviso de «precios de ejemplo» de la tarea 7 sigue
> puesto. Cuando lleguen los precios del asador se cambian las filas y cae el
> aviso.
>
> Cuatro cosas salieron distintas de como están escritas más abajo, y gana la
> realidad:
>
> 1. **El seed vive dentro de la migración**, no en `supabase/seed.sql`:
>    `supabase db push` aplica migraciones y no seeds, y una carta vacía no se
>    le puede enseñar a nadie. Los `insert` van guardados con `not exists`, así
>    que la migración se puede volver a aplicar.
> 2. **`useMenu()` no ordena por `category_id`.** Ese era un orden válido
>    mientras los ids venían de un JSON escrito a mano; la base de datos los
>    asigna según entran las filas y «Para picar» acabó siendo el id 1 y
>    «Brasa» el 2. Lo que ordena la carta es `categories.sort_order`.
> 3. **Sí se tocó un componente público en la 8.3**: `MenuSection` pintaba
>    `dishes.map()` sin mirar `loading` ni `error`, con lo que un fallo de red
>    dejaba la carta vacía para siempre y sin decirlo — el problema que
>    `docs/cleanCode.md` §0.2 ya tenía anotado. Después se reescribió entero:
>    la carta de la portada es ahora una cuadrícula a ancho completo, agrupada
>    por categorías, con una foto por plato (`DishCard`). Mientras no haya
>    fotos se pinta un marco de trama diagonal que mide lo mismo. La subida de
>    fotos se hizo el 04/09/2026 (fase 5 de `docs/panel.md`).
> 4. **El `db push` arrastró tres migraciones anteriores** que estaban sin
>    registrar. Dos ya estaban aplicadas a mano y volver a aplicarlas no cambió
>    nada, pero la del renombrado (`20260831093559`) **no lo estaba**: en
>    producción existía `agregar_admin` y no `add_admin`, así que dar de alta a
>    un admin estaba roto desde el despliegue del front. Ahora funciona.


Tres de las cuatro páginas del panel (`DishesPage`, `NewDishPage`,
`EditDishPage`, `CategoriesPage`) son stubs de ~20 líneas esperando estas
tablas. `docs/panel.md` §2 y §3 traen el DDL y el molde de políticas; esto es el
mismo trabajo partido en trozos que se pueden hacer en ratos sueltos.

**El orden importa y no es negociable.** Cada parte se apoya en la anterior y
deja el repo en un estado que compila y se puede enseñar. No empezar la 8.4 sin
haber visto la carta pública leyendo de la base de datos.

**La buena noticia antes de empezar.** Tres cosas ya están montadas y ahorran la
mitad del trabajo:

- `menu/types.ts` ya declara exactamente las columnas de las tablas futuras.
- `useMenu()` ya devuelve `{ dishes, categories, loading, error }` aunque hoy
  lea un JSON síncrono. Los componentes de la landing ya contemplan la espera,
  así que **ningún componente público se toca** en la 8.3.
- `TeamPage` + `useAdmins` ya son un CRUD real contra Supabase con RLS. Son el
  molde de todo lo que viene: no se empieza de cero, se copia un patrón que ya
  funciona en este repo.

---

### 8.1 Las dos tablas

**~45 min · sin esto no hay nada**

Una migración nueva, `<timestamp>_menu_tables.sql`, con todo lo de esta parte
junto: el DDL, los índices, las políticas y los grants. Que sea un solo archivo
importa — una tabla sin sus políticas está rota (ver la trampa de abajo), así que
no deben poder aplicarse por separado.

- [x] `categories`: `id bigint identity`, `name text not null`,
      `sort_order integer not null default 0`
- [x] `dishes`: `id`, `name`, `description text not null default ''`,
      `price_cents integer not null`, `category_id bigint references categories
      on delete restrict`, `sort_order`, `available boolean not null default
      true`, `photo_path text`, `created_at`/`updated_at timestamptz`
- [x] Índice en `dishes(category_id)` — toda foránea que se filtre necesita el
      suyo, Postgres no lo crea solo
- [x] Las dos políticas del molde en **cada** tabla: lectura pública
      (`using (available)` en `dishes`, `using (true)` en `categories`),
      escritura solo `is_admin()`
- [x] `revoke all` + grants explícitos por tabla, igual que se hizo con `Admins`
- [x] Aplicarla y comprobar desde el SQL Editor que existe

Nombres **en inglés**, según la nota del principio de `docs/panel.md` §2. El
documento los escribe en español en las tablas de columnas; la equivalencia está
ahí mismo.

⚠️ `price_cents` es `integer` de céntimos, nunca `float`. 18,50 no existe en
binario y acabas con platos a 18,499999.

⚠️ `categories` **no** lleva `using (available)`: no tiene esa columna. Copiar el
molde a ciegas es el error fácil aquí.

⚠️ Dos trampas de este repo documentadas en `docs/panel.md` §3:
1. El event trigger `ensure_rls` activa RLS en toda tabla nueva → una tabla
   recién creada devuelve **cero filas** hasta que tiene políticas. Insertas
   tres platos, haces el `select` desde la app y ves una lista vacía. No está
   rota; le faltan las políticas.
2. Los `alter default privileges` de la primera migración conceden
   `insert/update/delete` a `anon` sobre toda tabla futura de `public`. El RLS
   lo tapa, pero deja una sola capa de defensa. De ahí el `revoke` explícito.

---

### 8.2 Los datos reales dentro

**~30 min · la parte que no es código**

- [ ] Seed con las categorías y platos **reales del asador**, con sus precios
      buenos, insertado desde el SQL Editor
- [x] Dejar al menos un plato con `available = false`, para poder verificar en
      la 8.3 que el filtro funciona de verdad
- [x] Guardar el `insert` como `supabase/seed.sql` (o dentro de la migración de
      la 8.1 si es poca cosa)

`src/features/menu/data/menu.json` sirve de plantilla del formato, pero **sus
datos son de ejemplo** — pollo entero a 12,00 €. Esta es la parte que hay que
pedirle al asador, y por eso conviene pedírsela ya: es la única de las siete que
depende de otra persona y puede tardar días en llegar.

---

### 8.3 `useMenu()` deja de leer el JSON

**~45 min · aquí la carta pública ya sale de la base de datos**

- [x] Cambiar `useMenu()` a dos `select` de Supabase con `.order('sort_order')`
- [x] `useEffect` + `AbortController` en la limpieza, igual que `useAdmins`
- [x] `loading` pasa a ser de verdad `true` al principio; `error` deja de ser
      siempre `null`
- [x] Comprobar en la web que el plato con `available = false` **no** aparece
- [x] Borrar `src/features/menu/data/menu.json`

El cambio se queda **dentro de `src/features/menu/hooks/useMenu.ts`**. Ningún
componente se toca: la firma de retorno ya es la definitiva.

Dos cosas que hoy hace el hook y pasan a hacerse en SQL: el `.filter(available)`
lo hará la política RLS (ni siquiera llegan al cliente) y los dos `.sort()` los
hará `.order()`. Cuidado con el orden compuesto de `dishes`: hoy es
`category_id` y luego `sort_order`, que en Supabase son dos `.order()`
encadenados.

⚠️ Verificar el estado de carga de verdad, no solo que "se ve la carta". En
local con caché caliente el `loading` dura 20 ms y no se distingue de síncrono.
Con el throttling de red del navegador se ve si hay un salto de layout.

**Punto de parada natural.** Aquí ya hay algo que enseñar a los dueños y es lo
que de verdad ve el cliente. Si la 8.2 trae los precios buenos, aquí también
**cae solo el aviso de precios de ejemplo de la tarea 7**.

---

### 8.4 `useDishes()`: el hook de escritura

**~1 h · el corazón del panel**

Un hook nuevo en `src/features/admin/hooks/useDishes.ts`, calcado de
`useAdmins`: mismo `useEffect` + `useState` + `loading`/`error`, mismo
`AbortController`, mismos estados separados para la mutación en curso.

- [x] `dishes` — la lista **completa**, incluidos los no disponibles (el panel
      los tiene que ver; la landing no)
- [x] `createDish(dish)`, `updateDish(id, changes)`, `toggleAvailable(id)`
- [x] `deleteDish(id)` — existe, pero se usa en la 8.6 escondido tras
      confirmación
- [x] Un hook hermano `useCategories()` para el desplegable de categoría y para
      la 8.7

⚠️ La diferencia con `useMenu()` es que aquí `available` no filtra. Si el hook
del panel oculta los platos no disponibles, no hay forma de volver a ponerlos en
la carta — el botón de la 8.5 se vuelve un viaje sin retorno.

⚠️ Ojo a la invalidación, ya avisada en `docs/panel.md` §4: editas un precio en
`/admins/platos/7`, vuelves a la lista y la lista muestra el precio viejo porque
su `useEffect` no se ha vuelto a ejecutar. Se resuelve a mano actualizando el
estado local con la fila que devuelve el `update`, como hace
`useAdmins.addAdmin`. **No meter TanStack Query aquí**: con tres pantallas se
paga la dependencia sin cobrar el beneficio.

---

### 8.5 `DishesPage`: la lista

**~1 h · la pantalla que van a usar a diario**

- [x] Tabla de platos agrupados por categoría, con nombre, precio formateado
      con `formatPrice()` y enlace a editar
- [x] Interruptor **en carta / fuera de carta** por fila, que llama a
      `toggleAvailable` — es lo que más van a tocar y tiene que estar a un clic,
      sin entrar a editar
- [x] Los platos fuera de carta se ven, atenuados, no se esconden
- [x] Estados de `loading`, `error` y lista vacía, como en `TeamPage`

Sin florituras de diseño: **el panel puede ser feo, la carta no**
(`docs/panel.md`, principio 2). Estilo el de `TeamPage`, que es Tailwind gris y
directo.

---

### 8.6 El formulario: alta y edición

**~1 h · dos páginas, un componente**

- [x] `DishForm` en `src/features/admin/components/`, con `input`, `textarea` y
      un `select` de categorías. Sin editor enriquecido (`docs/panel.md` §6)
- [x] `NewDishPage` lo monta con valores vacíos
- [x] `EditDishPage` carga el plato por el `id` de la ruta y se lo pasa como
      valores iniciales. Si el id no existe, **404, no un formulario vacío**
- [x] El precio se teclea en euros («12,50») y se guarda en céntimos. La
      conversión, en un solo sitio junto a `formatPrice`
- [x] Borrar de verdad: escondido, con confirmación, en la página de edición y
      no en la lista

Un solo `DishForm` para las dos páginas es lo que evita que los dos formularios
se separen con el tiempo — hoy `NewDishPage` y `EditDishPage` ya tienen el
comentario puesto.

⚠️ El `on delete restrict` de `category_id` significa que borrar una categoría
con platos dentro **falla con un error de Postgres**, no borra en cascada. Es a
propósito (nada de huérfanos), pero el mensaje que llega es feo: hay que
traducirlo a algo legible en la 8.7.

⚠️ El parseo del precio es el punto sucio: «12,50», «12.50» y «12,5» tienen que
dar todos 1250. Coma decimal española, que `parseFloat` no entiende.

---

### 8.7 `CategoriesPage` y el orden

**~45 min · lo último, y lo más fácil de recortar**

- [x] Lista editable de categorías: nombre y `sort_order` como campo numérico
- [x] Alta y borrado de categoría, con el error de `restrict` traducido
- [x] `sort_order` de los platos editable desde `DishForm`

**Nada de arrastrar y soltar.** Un campo numérico editable resuelve el 90 % del
problema; el drag and drop, solo si lo piden después de usarlo un mes.

---

**Fuera de esta tarea, a propósito:** las fotos de los platos (`photo_path` se
crea en la 8.1 pero se queda vacío). Storage, subida, redimensionado en cliente
y reemplazo son la fase 5 de `docs/panel.md` §5 —hecha el 04/09/2026, después de
esta tarea—, la parte más fiddly, y no
bloquean nada de lo de arriba.

---

## 9. Renombrar las migraciones a `<timestamp>_nombre.sql` — ✅ HECHO (01/09/2026)

**~20 min · deuda que crece**

Los archivos de `supabase/migrations/` no llevaban prefijo de timestamp, así que
`supabase db push` no los reconocía y se aplicaban pegándolos a mano en el SQL
Editor.

- [x] Renombrar los cinco archivos existentes con prefijo de timestamp (el
      contenido se deja tal cual: son el registro de lo que ya está aplicado en
      la base de datos)
- [x] Pasar a usar el CLI para las siguientes

El timestamp de cada archivo es la fecha **UTC del commit que lo introdujo**, no
la de hoy: así el orden alfabético que lee el CLI es el orden real en que se
aplicaron a la base de datos. Los dos primeros recuperan el prefijo que ya
tuvieron en su commit original.

| archivo | de |
|---|---|
| `20260825235901_admins_rls.sql` | `admins_rls.sql` |
| `20260826000258_admins_signup_trigger.sql` | `admins_signup_trigger.sql` |
| `20260826094521_admins_aprobacion_manual.sql` | `admins_aprobacion_manual.sql` |
| `20260826100433_seguridad_permisos_por_defecto.sql` | `seguridad_permisos_por_defecto.sql` |
| `20260831093559_admins_rename_add_admin.sql` | `admins_rename_add_admin.sql` |

Hechos con `git mv`, para que el historial siga cada archivo. Actualizadas las
referencias en `README.md`, `docs/arquitectura.md`, `docs/seguridad.md` y
`docs/panel.md`.

⚠️ Renombrar no marca nada como aplicado: la tabla `supabase_migrations` del
proyecto remoto sigue vacía, porque las cuatro primeras se pegaron a mano. Antes
del primer `supabase db push` hay que sincronizar el historial
(`supabase migration repair --status applied <version>` por cada una ya
aplicada), o el CLI intentará ejecutarlas otra vez.

---

## 10. Error boundary y CI — ✅ HECHO (01/09/2026)

**~1 h · red de seguridad**

Cualquier `throw` en render dejaba pantalla en blanco sin ninguna pista.

- [x] `ErrorBoundary` envolviendo `<Routes>` en `src/app/App.tsx`
- [x] Workflow de GitHub Actions que corra `npm run lint && npm run build` en
      cada PR

`src/shared/components/ErrorBoundary.tsx` es una clase porque React solo da
`getDerivedStateFromError` / `componentDidCatch` a componentes de clase. Va
dentro de `<BrowserRouter>` (para tener contexto de router) y fuera de
`<Suspense>`, así que cubre también los fallos de carga de los chunks lazy del
panel. Pinta un bloque en el lenguaje visual de la casa con un botón de recarga
—recarga completa, no navegación: tras un error el árbol de React ya no es de
fiar— y deja el `componentStack` en consola, que es el único rastro que queda en
producción.

No captura errores de handlers, `setTimeout` ni promesas rechazadas: React nunca
se los pasa a un boundary. Eso es límite de React, no del componente.

`.github/workflows/ci.yml` corre en cada PR y en push a `main`: `npm ci`,
`npm run lint`, `npm run build`. No hay paso de tests porque todavía no hay
tests, y `npm run build` ya ejecuta `tsc -b`, así que los errores de tipos
también rompen el CI. El build corre **sin** las variables `VITE_SUPABASE_*`, a
propósito: comprueba que la app compila sin ellas.

Coste en el chunk público: +1,2 kB (+0,3 kB gzip), 255,2 kB / 80,8 kB gzip.

---

## 11. La tabla `plates` huérfana — ✅ ESCRITA, pendiente de aplicar (02/09/2026)

**~10 min · seguridad**

`public.plates` era el primer boceto de la carta (`title`, `price` en euros
enteros) con una sola fila de prueba dentro, «pollo asado». No la leía nadie: la
app nunca la ha mencionado.

Se borra porque es **anterior** a
`20260826100433_seguridad_permisos_por_defecto.sql` y conservaba los permisos de
entonces: `insert`, `update` y `delete` para `anon`. El RLS la tapaba —sin
políticas no devuelve nada—, pero una tabla que no usa nadie y que sobre el
papel puede escribir un visitante anónimo es una tabla que se borra.

- [x] `20260902212555_drop_plates.sql`
- [ ] **PENDIENTE** — aplicarla: `npx supabase db push --linked`

---

## 12. SEO: descripción, vista previa del enlace y ficha de Google — ✅ HECHO (02/09/2026)

**~45 min**

Antes de esto, la portada no tenía `<meta name="description">` —así que Google
se inventaba el resumen— y al pegar el enlace en WhatsApp salía un rectángulo
gris sin foto ni texto.

- [x] `src/features/landing/seo.ts`: descripción, Open Graph, Twitter Card y la
      ficha JSON-LD de tipo `Restaurant`
- [x] Un plugin en `vite.config.ts` que las escribe en `index.html`. **No puede
      hacerlo React**: los rastreadores leen el HTML que descargan y no ejecutan
      el JavaScript
- [x] Los datos salen de `content.ts`. Para eso se movieron allí la localidad,
      el código postal y la provincia, que estaban escritos a mano en
      `LocationSection` y `SiteFooter`
- [x] El horario de la ficha se genera desde `WEEKLY_SCHEDULE`, así que no puede
      contradecir al que se ve en la web
- [x] `public/og.jpg` (copia del logo) como imagen de la vista previa: en
      `public/` porque `src/assets` añade un hash al nombre en cada build y las
      cachés de los rastreadores se quedan con la URL vieja
- [x] La CSP lleva ahora el hash `sha256` del bloque JSON-LD: para la CSP es un
      `<script>` aunque no ejecute nada, y sin el hash el navegador lo bloquea

Lo que queda fuera hasta que haya dominio (tarea 4): `og:url`, el `canonical` y
la imagen de vista previa en absoluto. Se escriben solas en cuanto
`VITE_SITE_URL` tenga valor. **Una URL equivocada rompe la vista previa para
todo el mundo; una ausente, no.**

### SEO local, y el resto del `head` (02/09/2026, misma tanda)

Para un asador de pueblo esta es la mitad que de verdad trae clientes: la
búsqueda que importa es «pollo asado El Casar» hecha desde un móvil a dos
calles.

- [x] `<title>` con el pueblo dentro: «Asador El Casar · Pollo a la brasa en El
      Casar». Antes era solo el nombre
- [x] Metas `geo.region` (`ES-GU`) y `geo.placename`. Las lee Bing y las copian
      los directorios que raspan en vez de interpretar
- [x] En la ficha JSON-LD: `areaServed`, `hasMap` (el enlace de «cómo llegar»),
      `acceptsReservations` y, cuando haya dominio, `hasMenu` apuntando a
      `/#la-carta`
- [x] `robots` con `max-image-preview:large` y `max-snippet:-1`: que la foto del
      plato sea la grande del resultado y que el resumen no se corte
- [x] `public/robots.txt`, con `/admins` y `/login` fuera del rastreo
- [x] `preconnect` a Supabase: la carta pide los platos en cuanto pinta, así que
      la conexión se abre mientras baja el JavaScript
- [ ] **PENDIENTE** — las coordenadas exactas de la puerta en `content.ts`
      (`LATITUDE` / `LONGITUDE`). En Google Maps, clic derecho sobre el local →
      la primera línea del menú es el par. Mientras estén vacías se omiten
      `geo.position`, `ICBM` y el bloque `geo` de la ficha: **un pin a 400 m es
      peor que ningún pin**

Cómo comprobarlo cuando esté desplegado: pegar el enlace en un chat de WhatsApp
(la vista previa) y pasar la URL por el *Rich Results Test* de Google (la
ficha).

---

## 13. Rendimiento: lo que había detrás del 42 de Lighthouse — ✅ HECHO (03/09/2026)

**~1 h**

El informe que lo motivó estaba hecho sobre `localhost:5173`, es decir sobre el
**servidor de desarrollo**: Vite sirve ahí los módulos sin empaquetar ni
minificar y transforma cada archivo al vuelo, así que esa nota no es la de la
web. La medición que vale es sobre `npm run build && npm run preview` — y de
paso es el único sitio donde se ve la CSP, que es como lleva rota la tarea 0.1
de `docs/cleanCode.md` desde que se escribió.

Aun así, tres de las cosas que señalaba eran reales:

- [x] **Las fuentes, al propio dominio.** Eran una hoja de Google Fonts en el
      `head`: bloquea el pintado, obliga a abrir conexión con dos dominios más
      antes de saber qué archivos pedir, y el titular saltaba al llegar Anton
      (el grueso del CLS de 0,286). Ahora son ocho `.woff2` en `public/fonts`
      con sus `@font-face` en `index.css`, y se precargan los dos del primer
      pintado. Solo los subconjuntos `latin` y `latin-ext`; Space Grotesk es
      variable, así que un archivo cubre de 400 a 700
- [x] **La carta ya no salta al cargar.** Mientras llegan los platos se pintan
      seis tarjetas vacías del tamaño final (`DishCardSkeleton`) en vez de una
      línea de «Cargando…» que luego empujaba media página hacia abajo
- [x] **El logo pesaba 77 kB para verse a 52 px** (906 × 906). Redimensionado a
      160 × 160: 10 kB. `public/og.jpg` conserva el original, que ahí sí tiene
      que ser grande
- [x] **`width` y `height` en el logo**, que es lo que el navegador tiene antes
      de que llegue el CSS
- [x] **`supabase-js` fuera de la carta pública** (−54 kB gzip en la primera
      carga). Ver `docs/arquitectura.md`: `useMenu()` pide sus dos tablas con
      `fetch` al endpoint REST, que es lo que la librería habría enviado, y el
      cliente se queda para el panel
- [ ] **PENDIENTE** — volver a medir con Lighthouse sobre `npm run preview`, no
      sobre `npm run dev`. Ese número es el primero que significa algo

Lo que no se ha tocado y sigue siendo el techo: la landing se pinta entera desde
JavaScript, así que el primer pintado espera a React. Bajar de ahí es
prerenderizado, y eso es otra tarea y otra decisión.

---

# Las 10 siguientes (05/09/2026)

Sale de repasar lo que quedó marcado **PENDIENTE** arriba, lo que `docs/cleanCode.md`
dejó sin hacer, y lo que han traído los últimos cuatro commits (prerenderizado,
CSP, redimensionado de imágenes). El orden vuelve a ser *qué desbloquea más por
menos esfuerzo*: las cuatro primeras suman una hora larga y son las que separan
el repo de estar publicado.

Estado al escribir esto: `npm run build` incluye ya `scripts/prerender.mjs`, hay
un cambio sin commitear en `src/main.tsx` y `src/app/App.tsx`, y no hay ningún
fichero de despliegue en el repo.

---

## 14. La CSP sigue bloqueando el mapa — ✅ HECHO (05/09/2026)

**~2 min · bug en producción · viene de `docs/cleanCode.md` §0.1**

`vite.config.ts:136` sigue inyectando `frame-src 'none'` y
`LocationSection.tsx:88` sigue pintando el `<iframe>` de Google Maps. Está
escrito como urgente desde el 30/08 y no se ha tocado. En `npm run dev` no se ve
—el plugin es `apply: 'build'`—; se ve en `npm run preview`, que es exactamente
lo que nadie hace antes de desplegar.

- [x] `"frame-src 'none'"` → `"frame-src https://www.google.com"`
- [x] Comprobado sobre la build: `dist/index.html` lleva ya
      `frame-src https://www.google.com` en la meta de CSP

Nada de `*`: la gracia de la directiva es que solo Google Maps pueda empotrarse.

---

## 15. Cerrar la hidratación: el cambio suelto en `main.tsx`

**~20 min · el árbol de trabajo está sucio**

`git status` lleva dos ficheros modificados sin commitear: `App.tsx` exporta
ahora `isLanding` y `main.tsx` decide con esa bandera en vez de con
`root.hasChildNodes()`. El razonamiento del comentario es correcto y es el bug
que el prerenderizado introdujo: hay un solo `index.html` y el hosting lo sirve
para todas las rutas, así que `/admins` también recibe la landing horneada
dentro de `#root`; hidratar ahí es pedirle a React que case la carta contra lo
que pinta el router, no casa nunca, y tira el árbol entero.

Falta comprobarlo de verdad antes de darlo por bueno:

- [ ] `npm run build && npm run preview`, entrar directo a `/admins/equipo` y a
      `/login` y mirar la consola: cero avisos de hidratación
- [ ] Recargar `/` y confirmar que **no** repinta (el HTML horneado se adopta)
- [ ] Commitear los dos ficheros juntos; separados, ninguno compila

---

## 16. Configuración de despliegue

**~30 min · bloqueante para producción · es la tarea 4, sin empezar**

Sigue sin haber `vercel.json`, `netlify.toml` ni `_redirects`. Sin rewrite de
SPA, recargar en `/admins/equipo` devuelve el 404 del hosting. Con el
prerenderizado ya hecho, el rewrite es además lo que hace que la landing
horneada llegue a quien entra por cualquier ruta.

- [ ] Elegir hosting y añadir el rewrite SPA (todo a `/index.html`)
- [ ] Cabecera `X-Robots-Tag: noindex` para `/admins/*` y `/login`. El comentario
      de `index.html:9` da eso por hecho desde hace una semana
- [ ] `VITE_SITE_URL` con el dominio, en el hosting **y** en el `.env` local.
      Hasta que tenga valor, la tarea 12 deja fuera `og:url`, el `canonical` y la
      imagen absoluta de la vista previa
- [ ] Meter `npm run preview` en la rutina previa a cada release: es el único
      sitio donde la CSP se ejecuta (ver la 14)

---

## 17. Aplicar las migraciones pendientes

**~15 min · seguridad**

Hay ocho ficheros en `supabase/migrations/` y al menos dos que no consta que
estén aplicados: `20260902212555_drop_plates.sql` (la tabla huérfana con
`insert`/`update`/`delete` para `anon`, tarea 11) y
`20260904120000_dish_photos_storage.sql`, que es de anteayer.

- [ ] `npx supabase db push --linked`
- [ ] Verificar en el SQL Editor que `public.plates` ya no existe
- [ ] Verificar que subir una foto desde el panel funciona contra el bucket real,
      no solo en local

Una migración escrita y no aplicada es una migración que no existe, con el
agravante de que el repo dice lo contrario.

---

## 18. Los datos reales de la carta

**~1 h (la mayor parte no es código) · cierra la 7 y la 8**

Las tablas de Supabase están y el panel escribe en ellas desde la tarea 8. Lo que
falta son los platos del asador: hoy la carta enseña «pollo entero 12,00 €», que
es un precio inventado, con un aviso debajo que lo confiesa.

- [ ] Cargar categorías y platos reales desde el panel (`/admins/platos`)
- [ ] Foto de cada plato
- [ ] Quitar el aviso «Precios de ejemplo — sustituir por los reales»
      (`MenuSection.tsx:71`) — **después**, nunca antes: quitarlo con los precios
      falsos puestos convierte un marcador visible en un precio que parece real

---

## 19. Las coordenadas del local

**~5 min · viene de la tarea 12**

`content.ts:36-37` tiene `LATITUDE` y `LONGITUDE` vacías, así que `seo.ts` omite
`geo.position`, `ICBM` y el bloque `geo` de la ficha JSON-LD. Para un asador de
pueblo esa ficha es la mitad del SEO que trae clientes.

- [ ] En Google Maps, clic derecho sobre la puerta del local → la primera línea
      del menú es el par; pegarlo en `content.ts`
- [ ] Pasar la URL por el *Rich Results Test* cuando haya dominio (tarea 16)

Un pin a 400 m es peor que ningún pin: por eso están vacías y no aproximadas.

---

## 20. `"strict": true` explícito

**~1 min · viene de `docs/cleanCode.md` §5**

`tsconfig.app.json` sigue sin declararlo. Funciona porque TypeScript 6 lo trae
por defecto, es decir: depende de un default de la herramienta, no de una
decisión del proyecto. El día que ese default cambie, el síntoma serán
`undefined` en producción meses después.

- [ ] Añadir `"strict": true` a `tsconfig.app.json`
- [ ] De paso, quitar el `!` de `useIsAdmin.ts` capturando el valor en una const
      dentro del `useEffect`

---

## 21. Alias `@/` para las importaciones — ✅ HECHO (05/09/2026)

**~15 min · viene de `docs/cleanCode.md` §2**

Con `features/` + `shared/` ya asentados, las rutas relativas de tres niveles son
lo normal en el panel. Un alias las convierte en absolutas y hace que mover un
fichero deje de romper a sus vecinos.

- [x] `resolve.alias` en `vite.config.ts` (`@` → `src`)
- [x] `paths` en `tsconfig.app.json`. **Sin `baseUrl`**: TypeScript 6 lo
      deprecó y el build falla con TS5101 si se declara; desde la 5.0 `paths`
      ya resuelve relativo al propio tsconfig, así que no hace falta
- [x] Reescritas las 55 importaciones con dos o más `../` en 26 ficheros. Las de
      un solo `../` se quedan relativas: dicen «esto es vecino» y eso es
      información

Un solo criterio, mecánico: dos `../` ya salen del dominio (`features/admin` →
`features/menu`), así que la frontera del alias es exactamente la frontera entre
dominios. `npm run lint` limpio y `npm run build` verde, prerenderizado incluido
—que importa porque `scripts/prerender.mjs` hace una segunda build de Vite y
habría sido el sitio donde un alias a medias fallaría.

---

## 22. Prettier en el CI — ✅ HECHO (05/09/2026)

**~15 min · viene de `docs/cleanCode.md` §8**

El CI corre `lint` y `build`. El formato no lo revisa nadie, y se nota: hay
ficheros con comillas simples y ficheros con dobles, `main.tsx` sin punto y coma
y el resto con él.

- [x] `prettier` como dependencia de desarrollo, **fijado a la versión exacta**
      (3.9.6, sin `^`): un rango dejaría que el CI empezase a fallar solo el día
      que una release mueva un salto de línea
- [x] `.prettierrc.json` con lo que ya se usaba, no con los defaults:
      `semi: false` y `singleQuote: true` (145 importaciones con comilla simple
      frente a 11 con doble) y `printWidth: 80`, que es donde ya estaban
      envueltos los comentarios — el p90 de las líneas del repo era 77
- [x] `npm run format` y `npm run format:check`
- [x] `format:check` en `ci.yml`, **antes** del build: es el fallo más barato y
      el de arreglo más obvio
- [x] Pasado una vez sobre todo el repo: 45 ficheros de `src/`, más
      `index.html`, `vite.config.ts` y `scripts/prerender.mjs`

`.prettierignore` es la mitad menos obvia de esto y lo que evita tres problemas
distintos:

- **`docs/` y el resto de `*.md` fuera.** Prettier rehace los párrafos y las
  tablas, y eso convierte cualquier edición futura de la documentación en un
  diff ilegible. Es prosa, no código.
- **`.claude/` y `.agents/` fuera.** Son ficheros instalados de fuera; la
  primera pasada reformateó 24 000 líneas de catálogos de fuentes e iconos que
  no son de este repo. Formatearlos convierte cada actualización de upstream en
  un conflicto.
- **`supabase/.temp/` y `package-lock.json` fuera.** No los escribe una persona.

Comprobado que `npm run lint`, `npm run format:check` y `npm run build` —los tres
pasos del CI, en ese orden— pasan sobre el árbol ya formateado, prerenderizado
incluido: el reformateo tocó `index.html`, y `scripts/prerender.mjs` busca ahí
la cadena exacta `<div id="root"></div>` para inyectar el HTML.

---

## 23. Medir Lighthouse sobre `preview`

**~20 min · cierra la 13**

El 42 que motivó la tarea 13 estaba medido sobre `npm run dev`, o sea sobre
módulos sin empaquetar. Desde entonces se han hecho las fuentes locales, los
esqueletos de la carta, el logo a 160 px, `supabase-js` fuera del chunk público
y el prerenderizado de la landing — y **ninguna de esas cinco cosas se ha
medido**.

- [ ] `npm run build && npm run preview` y pasar Lighthouse ahí. Idealmente ya
      con el dominio de la 16, que es la medida buena
- [ ] Anotar LCP y CLS en este documento: la 13 dijo que el CLS venía de Anton
      cargando tarde, y eso o se cayó con las fuentes locales o no
- [ ] Si el LCP sigue alto con la landing ya horneada, el techo que queda es la
      imagen del héroe, no el JavaScript

Este es el primer número del proyecto que significa algo. Hasta tenerlo, todo lo
de la tarea 13 es una hipótesis razonable sin confirmar.

---

## 24. Las dos grietas de la revisión técnica — ✅ HECHO (05/09/2026)

**~1 h · fuera de la lista de diez: salieron de leer el código, no de la lista**

### 24.1 La carta pública se saltaba la comprobación de entorno

`shared/lib/supabaseEnv.ts` existe para que una variable ausente falle con un
mensaje que la nombre. Pero `features/menu/hooks/useMenu.ts` lee
`import.meta.env` por su cuenta —a propósito, para no arrastrar el módulo del
panel al chunk de la landing— y no comprobaba nada. En la única página que ve
todo el mundo, un `.env` mal puesto viajaba como `Bearer undefined` y volvía
como un 401 que no nombra nada.

- [x] El mismo guard, repetido en `useMenu.ts`. Repetido y no importado: son
      seis líneas frente a los 54 kB gzip que este hook existe para no cargar
- [x] `ci.yml` pasa ahora dos valores de relleno a `npm run build`

Lo segundo no es un parche, es la consecuencia correcta. El CI construía **sin**
las variables a propósito, «para comprobar que la app compila sin ellas» — pero
Vite sustituye `import.meta.env.VITE_*` en tiempo de build, así que eso no
produce una app que las leerá luego: produce una app con `undefined` incrustado
y la carta rota para siempre. Que ese build falle es lo que se quiere; lo que
había que cambiar era el CI.

### 24.2 Los `as Dish[]` eran la tarea 1 otra vez

Este documento abre denunciando que `carta.platos as Plato[]` silenciaba a
TypeScript. Había siete casts de la misma familia repartidos por los hooks del
panel, y ninguno comprobaba nada: los tipos de `features/menu/types.ts` eran una
forma escrita a mano y repetida, no el esquema.

- [x] `npm run types:db` → `src/shared/lib/database.types.ts`, generado con
      `supabase gen types typescript --linked`
- [x] `createClient<Database>(…)`: con el esquema en el tipo, supabase-js ya
      sabe qué devuelve cada `select` y los siete casts sobran
- [x] `Category`, `Dish` y `Admin` recortados del esquema con `Pick`. `Pick` y
      no el `Row` entero porque las consultas piden unas columnas y no
      `created_at` / `updated_at`: decir que están sería la misma mentira en la
      otra dirección
- [x] Coste en el bundle: **cero**. Es un `import type`, y se borra al compilar

Y de propina, lo que destapó al tipar el cliente: `.eq('user_id', userId)` dejó
de aceptar un `string | undefined`, que era el `!` de `useIsAdmin.ts` que
`docs/cleanCode.md` §5 llevaba señalando desde el 30/08. Arreglado como pedía el
documento, capturando el valor en una const dentro del `useEffect`. Ya no queda
ningún `!` en el proyecto.

⚠️ **Los tipos generados salen del esquema real, y el real está por detrás de
las migraciones**: el fichero contiene `plates`, la tabla que
`20260902212555_drop_plates.sql` borra desde el 02/09. Esa línea desaparecerá
sola al hacer la tarea 17 y volver a generar. Mientras esté, es la prueba en el
repo de que hay migraciones sin aplicar.

Lo que **no** se ha hecho, y conviene tenerlo escrito: `useMenu` sigue sin
validar en tiempo de ejecución lo que responde PostgREST — su `select<T>()` es
un genérico, o sea una afirmación. El enlace con el esquema ya es de compilación
y eso era lo que faltaba; un validador de verdad sería una tercera copia de la
forma de las tablas y no vale su precio con dos tablas y sesenta filas.
