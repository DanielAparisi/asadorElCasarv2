# Próximas tareas

Lista de trabajo ordenada por prioridad, salida de la revisión técnica del
30/08/2026. El criterio del orden es *qué desbloquea más por menos esfuerzo*,
no la gravedad aislada de cada punto.

Estado del repo en el momento de escribir esto: `npm run build` pasa (469 kB /
135 kB gzip en un único chunk) y `npm run lint` sale limpio.

Las tres primeras son media mañana entre las tres. La 8 es la que convierte el
panel en algo realmente usable.

---

## 1. `carta.json` miente sobre su tipo

**~15 min · bug latente**

Ningún plato del JSON tiene el campo `orden`, pero `type Plato` lo declara
obligatorio y el `carta.platos as Plato[]` de `src/hooks/useCarta.ts:57` silencia
el error de TypeScript.

Consecuencia: el comparador hace `undefined - undefined` → `NaN`, devuelve 0, y
el orden de los platos dentro de cada categoría acaba siendo accidental (el del
array). Hoy no se nota porque el JSON ya está en el orden deseado; se notará el
día que alguien reordene.

- [ ] Añadir `orden` a los 6 platos de `src/lib/carta.json`
- [ ] Quitar el `as Plato[]` para que TypeScript vuelva a vigilar la forma

---

## 2. La home pública espera al chequeo de auth

**~30 min · rendimiento percibido**

`src/App.tsx:22` devuelve `<Spinner />` para **todas** las rutas mientras se
resuelven la sesión y el `esAdmin`. Un visitante anónimo ve un spinner mientras
se lee localStorage, antes de que se pinte la carta. Es la ruta que más tráfico
tiene y la que peor arranca.

- [ ] Mover el gate de carga dentro de las rutas que de verdad lo necesitan
      (`/login` y `/admins`)
- [ ] Dejar que `/` renderice de inmediato, sin esperar a auth

---

## 3. Partir el bundle

**~20 min · rendimiento**

469 kB (135 kB gzip) en un solo chunk: todo visitante de la carta se descarga el
panel de administración y `@supabase/auth-js` sin usarlos nunca.

- [ ] `React.lazy()` sobre las páginas de `/admins`
- [ ] `<Suspense fallback={<Spinner />}>` envolviendo la rama del panel
- [ ] Verificar la reducción con `npm run build`

Debería dejar la home en aproximadamente la mitad.

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

## 5. Race en `useSession`

**~10 min · corrección**

`getSession()` y `onAuthStateChange` corren en paralelo
(`src/hooks/useSession.ts:19-26`). Si el callback del listener se adelanta, el
`.then()` tardío lo pisa con un valor viejo.

- [ ] Escribir la sesión inicial solo si aún no ha llegado ningún evento, o
      reordenar para que la última escritura sea siempre la del listener

---

## 6. `PRIVATE_API_KEY` fuera del `.env`

**~5 min · higiene de seguridad**

`.env` está correctamente ignorado por git, pero una clave privada en un
proyecto 100 % cliente no tiene dónde usarse sin acabar filtrada en el bundle.

- [ ] Eliminar `PRIVATE_API_KEY` de `.env`
- [ ] Si algún día hace falta, va en una Edge Function, nunca en el cliente

---

## 7. Limpieza y detalles

**~30 min**

- [ ] Borrar `src/App.css` (está vacío, sin referencias)
- [ ] Borrar `src/assets/react.svg` y `src/assets/vite.svg` (sin referencias)
- [ ] `Marca` usa `href="#"` (`src/components/ui.tsx:147`): desde `/404` no
      vuelve al inicio. Debería ser `<Link to="/">`
- [ ] Quitar el aviso «Precios de ejemplo — sustituir por los reales»
      (`src/pages/home.tsx:81`) cuando los precios sean los buenos

---

## 8. Las tablas `platos` y `categorias`

**~medio día · el desbloqueo real**

Tres de las cuatro páginas del panel (`resumen`, `platoNuevo`, `platoEditar`,
`categorias`) son stubs esperando estas tablas. `docs/panel.md` §2 y §3 ya traen
el DDL y el molde de políticas.

- [ ] Crear `categorias` y `platos` con el esquema de `docs/panel.md` §2
- [ ] Índice en `platos(categoria_id)` — Postgres no lo crea solo
- [ ] Las dos políticas del molde: lectura pública de lo disponible, escritura
      solo admin
- [ ] `revoke` explícito por tabla, como se hizo con `Admins`
- [ ] Cambiar `useCarta()` de JSON a Supabase — el cambio se queda dentro de ese
      archivo, ningún componente se toca
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

- [ ] Renombrar los cuatro archivos existentes con prefijo de timestamp
- [ ] Pasar a usar el CLI para las siguientes

Hacerlo ahora que son cuatro, no cuando sean diez.

---

## 10. Error boundary y CI

**~1 h · red de seguridad**

Hoy cualquier `throw` en render deja pantalla en blanco sin ninguna pista.

- [ ] `ErrorBoundary` envolviendo `<Routes>` en `src/App.tsx`
- [ ] Workflow de GitHub Actions que corra `npm run lint && npm run build` en
      cada PR
