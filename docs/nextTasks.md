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
> `supabase/migrations/admins_rename_add_admin.sql` en el SQL Editor: el
> cliente ya llama a `add_admin`.

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

## 8. Las tablas `platos` y `categorias`

**~medio día · el desbloqueo real**

Tres de las cuatro páginas del panel (`resumen`, `platoNuevo`, `platoEditar`,
`categorias`) son stubs esperando estas tablas. `docs/panel.md` §2 y §3 ya traen
el DDL y el molde de políticas.

- [ ] Crear `categories` y `dishes` con el esquema de `docs/panel.md` §2 — ojo
      a la nota de nombres en inglés al principio de esa sección
- [ ] Índice en `dishes(category_id)` — Postgres no lo crea solo
- [ ] Las dos políticas del molde: lectura pública de lo disponible, escritura
      solo admin
- [ ] `revoke` explícito por tabla, como se hizo con `Admins`
- [ ] Cambiar `useMenu()` de JSON a Supabase — el cambio se queda dentro de
      `src/features/menu/hooks/useMenu.ts`, ningún componente se toca
- [ ] Rellenar las páginas stub del panel

Dos trampas documentadas en `docs/panel.md` §3 que conviene tener delante:

1. El event trigger `ensure_rls` activa RLS en toda tabla nueva → una tabla
   recién creada devuelve **cero filas** hasta que tiene políticas. No está
   rota; le faltan las políticas.
2. Los `alter default privileges` de la primera migración conceden
   `insert/update/delete` a `anon` sobre toda tabla futura de `public`. El RLS
   lo tapa, pero deja una sola capa de defensa.

---

## 9. Renombrar las migraciones a `<timestamp>_nombre.sql`

**~20 min · deuda que crece**

Los archivos de `supabase/migrations/` no llevan prefijo de timestamp, así que
`supabase db push` no los reconoce y se aplican pegándolos a mano en el SQL
Editor.

- [ ] Renombrar los cinco archivos existentes con prefijo de timestamp (el
      contenido de los cuatro antiguos se deja tal cual: son el registro de lo
      que ya está aplicado en la base de datos)
- [ ] Pasar a usar el CLI para las siguientes

Hacerlo ahora que son cinco, no cuando sean diez.

---

## 10. Error boundary y CI

**~1 h · red de seguridad**

Hoy cualquier `throw` en render deja pantalla en blanco sin ninguna pista.

- [ ] `ErrorBoundary` envolviendo `<Routes>` en `src/app/App.tsx`
- [ ] Workflow de GitHub Actions que corra `npm run lint && npm run build` en
      cada PR
