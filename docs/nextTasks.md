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
      existía

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

## 8. La carta desde Supabase — el desbloqueo real

**~5 h repartidas en 7 partes · cada una deja algo que funciona**

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

- [ ] `categories`: `id bigint identity`, `name text not null`,
      `sort_order integer not null default 0`
- [ ] `dishes`: `id`, `name`, `description text not null default ''`,
      `price_cents integer not null`, `category_id bigint references categories
      on delete restrict`, `sort_order`, `available boolean not null default
      true`, `photo_path text`, `created_at`/`updated_at timestamptz`
- [ ] Índice en `dishes(category_id)` — toda foránea que se filtre necesita el
      suyo, Postgres no lo crea solo
- [ ] Las dos políticas del molde en **cada** tabla: lectura pública
      (`using (available)` en `dishes`, `using (true)` en `categories`),
      escritura solo `is_admin()`
- [ ] `revoke all` + grants explícitos por tabla, igual que se hizo con `Admins`
- [ ] Aplicarla y comprobar desde el SQL Editor que existe

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
- [ ] Dejar al menos un plato con `available = false`, para poder verificar en
      la 8.3 que el filtro funciona de verdad
- [ ] Guardar el `insert` como `supabase/seed.sql` (o dentro de la migración de
      la 8.1 si es poca cosa)

`src/features/menu/data/menu.json` sirve de plantilla del formato, pero **sus
datos son de ejemplo** — pollo entero a 12,00 €. Esta es la parte que hay que
pedirle al asador, y por eso conviene pedírsela ya: es la única de las siete que
depende de otra persona y puede tardar días en llegar.

---

### 8.3 `useMenu()` deja de leer el JSON

**~45 min · aquí la carta pública ya sale de la base de datos**

- [ ] Cambiar `useMenu()` a dos `select` de Supabase con `.order('sort_order')`
- [ ] `useEffect` + `AbortController` en la limpieza, igual que `useAdmins`
- [ ] `loading` pasa a ser de verdad `true` al principio; `error` deja de ser
      siempre `null`
- [ ] Comprobar en la web que el plato con `available = false` **no** aparece
- [ ] Borrar `src/features/menu/data/menu.json`

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

- [ ] `dishes` — la lista **completa**, incluidos los no disponibles (el panel
      los tiene que ver; la landing no)
- [ ] `createDish(dish)`, `updateDish(id, changes)`, `toggleAvailable(id)`
- [ ] `deleteDish(id)` — existe, pero se usa en la 8.6 escondido tras
      confirmación
- [ ] Un hook hermano `useCategories()` para el desplegable de categoría y para
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

- [ ] Tabla de platos agrupados por categoría, con nombre, precio formateado
      con `formatPrice()` y enlace a editar
- [ ] Interruptor **en carta / fuera de carta** por fila, que llama a
      `toggleAvailable` — es lo que más van a tocar y tiene que estar a un clic,
      sin entrar a editar
- [ ] Los platos fuera de carta se ven, atenuados, no se esconden
- [ ] Estados de `loading`, `error` y lista vacía, como en `TeamPage`

Sin florituras de diseño: **el panel puede ser feo, la carta no**
(`docs/panel.md`, principio 2). Estilo el de `TeamPage`, que es Tailwind gris y
directo.

---

### 8.6 El formulario: alta y edición

**~1 h · dos páginas, un componente**

- [ ] `DishForm` en `src/features/admin/components/`, con `input`, `textarea` y
      un `select` de categorías. Sin editor enriquecido (`docs/panel.md` §6)
- [ ] `NewDishPage` lo monta con valores vacíos
- [ ] `EditDishPage` carga el plato por el `id` de la ruta y se lo pasa como
      valores iniciales. Si el id no existe, **404, no un formulario vacío**
- [ ] El precio se teclea en euros («12,50») y se guarda en céntimos. La
      conversión, en un solo sitio junto a `formatPrice`
- [ ] Borrar de verdad: escondido, con confirmación, en la página de edición y
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

- [ ] Lista editable de categorías: nombre y `sort_order` como campo numérico
- [ ] Alta y borrado de categoría, con el error de `restrict` traducido
- [ ] `sort_order` de los platos editable desde `DishForm`

**Nada de arrastrar y soltar.** Un campo numérico editable resuelve el 90 % del
problema; el drag and drop, solo si lo piden después de usarlo un mes.

---

**Fuera de esta tarea, a propósito:** las fotos de los platos (`photo_path` se
crea en la 8.1 pero se queda vacío). Storage, subida, redimensionado en cliente
y reemplazo son la fase 5 de `docs/panel.md` §5, la parte más fiddly, y no
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
