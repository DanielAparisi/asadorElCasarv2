# El panel de administración: cómo construirlo

Documento de trabajo. Recoge las decisiones tomadas y el orden en que conviene
atacarlas. No es una especificación cerrada: si algo se contradice con la
realidad al construirlo, gana la realidad — pero conviene actualizar esto.

**Quiénes lo usan:** los dueños del asador. Tres o cuatro personas, no técnicas,
entrando desde el móvil o desde el ordenador de la oficina.

**Qué necesitan hacer:** añadir un plato, quitarlo de la carta, cambiar un
precio, reordenar la carta. Eso es todo. Todo lo demás es especulación.

**Dos principios que ordenan el resto del documento:**

1. **Nada de lo que hagan debe ser irreversible.** Un usuario no técnico que
   borra algo por error y no puede recuperarlo deja de usar la herramienta.
2. **El panel puede ser feo; la carta no.** El esfuerzo de diseño va al lado
   público. El panel solo tiene que ser difícil de romper.

---

## 1. La app son dos apps

| | Carta pública | Panel |
|---|---|---|
| Rutas | `/`, `/carta` | `/admins/*` |
| Quién entra | todo el mundo, sin sesión | 3-4 personas con sesión |
| Prioridad | rápida y bonita | segura y clara |
| Rol de Postgres | `anon` | `authenticated` + `is_admin()` |

Comparten base de datos y cliente de Supabase. No comparten layout ni
navegación. El routing debería reflejarlo: rutas anidadas bajo `/admins` con un
layout propio, y **un único guard en la ruta padre** en vez de repetir la
comprobación de `esAdmin` en cada hijo.

Estructura de rutas a la que se tiende:

```
/                       carta pública
/login                  acceso
/admins                 layout del panel (guard aquí)
  /admins               resumen / lista de platos
  /admins/platos/nuevo  alta
  /admins/platos/:id    edición
  /admins/categorias    orden y nombres
  /admins/equipo        alta de admins (lo que hoy es /admins)
/404
```

---

## 2. Modelo de datos

> **Nota (31/08/2026).** Desde el paso del código a inglés, las tablas y
> columnas de esta sección se crean con nombres en inglés. La equivalencia con
> lo que se lee más abajo es directa:
>
> | en este documento | nombre real |
> |---|---|
> | `categorias` | `categories` |
> | `platos` | `dishes` |
> | `nombre` | `name` |
> | `descripcion` | `description` |
> | `precio_centimos` | `price_cents` |
> | `categoria_id` | `category_id` |
> | `orden` | `sort_order` (`order` es palabra reservada en SQL) |
> | `disponible` | `available` |
> | `foto_path` | `photo_path` |
>
> Los tipos de `src/features/menu/types.ts` ya usan estos nombres. La tabla
> `Admins` no cambia. La función `agregar_admin(correo)` pasó a ser
> `add_admin(email)` en
> `supabase/migrations/20260831093559_admins_rename_add_admin.sql`.


### Vocabulario

No son *recetas*, son **platos de la carta**. Una receta son ingredientes y
elaboración, cosa interna de cocina; un plato tiene nombre, precio y sale a la
web. Si algún día hacen falta las dos cosas, serán dos tablas. La tabla se llama
`platos`.

### Tablas

**`categorias`** — Entrantes, Carnes a la brasa, Postres…

| columna | tipo | nota |
|---|---|---|
| `id` | `bigint identity` | |
| `nombre` | `text not null` | |
| `orden` | `integer not null default 0` | la carta se ordena a mano, no alfabéticamente |

**`platos`**

| columna | tipo | nota |
|---|---|---|
| `id` | `bigint identity` | |
| `nombre` | `text not null` | |
| `descripcion` | `text not null default ''` | |
| `precio_centimos` | `integer not null` | ver abajo |
| `categoria_id` | `bigint references categorias` | `on delete restrict`: no dejar huérfanos |
| `orden` | `integer not null default 0` | posición dentro de su categoría |
| `disponible` | `boolean not null default true` | ver abajo |
| `foto_path` | `text` | ruta en Storage, no URL completa |
| `created_at` / `updated_at` | `timestamptz` | |

**`Admins`** — ya existe. Sin cambios.

### Dos decisiones difíciles de revertir

**El precio en céntimos, como `integer`.** Nunca `float` ni `real`: los decimales
binarios no representan 18,50 de forma exacta y acabas con platos a 18,499999.
`numeric(10,2)` es igual de correcto y más cómodo de leer en el SQL Editor.
Cualquiera de las dos vale; lo que no vale es coma flotante. Elegida:
`integer` en céntimos, con el formateo a "18,50 €" hecho en el cliente con
`Intl.NumberFormat`.

**Quitar un plato de la carta no lo borra.** Se quita el Chuletón en enero y se
repone en marzo: nadie quiere reescribir la descripción. El botón visible del
panel cambia `disponible` a `false`. El `delete` real existe pero está escondido
y pide confirmación — es para errores de tecleo, no para la operativa diaria.

### Índices

- `platos(categoria_id)` — toda clave foránea que se filtre necesita índice
  propio; Postgres no lo crea solo.
- `platos(disponible)` sólo si la tabla crece de verdad. Con 60 platos no
  aporta nada.

---

## 3. Seguridad: el patrón que se repite

La pieza clave ya está construida: `private.is_admin()`, `security definer`, con
`search_path` vacío y `select auth.uid()` envuelto. Toda tabla nueva usa el mismo
molde de dos políticas:

```sql
-- Lectura pública, solo de lo publicado
create policy "carta publica" on public.platos
  for select to anon, authenticated
  using (disponible);

-- Escritura solo admin
create policy "admins escriben" on public.platos
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
```

`anon` lee los platos disponibles, no ve los ocultos, y no ve `Admins` en
absoluto. Sin backend propio.

### Dos trampas de este repo en concreto

**1. El event trigger `ensure_rls`.** Activa RLS automáticamente en toda tabla
nueva de `public`. Es una red de seguridad excelente y conviene conservarla, pero
significa que **una tabla recién creada devuelve cero filas hasta que tiene
políticas**. Síntoma: creas `platos`, insertas tres desde el SQL Editor, haces el
`select` desde la app y ves una lista vacía. No está rota; le faltan las
políticas.

**2. Los `alter default privileges`.** La primera migración concede
`insert/update/delete` a `anon` sobre toda tabla futura de `public`. El RLS lo
tapa, pero eso deja una sola capa de defensa. En cada tabla nueva, `revoke`
explícito como se hizo con `Admins`:

```sql
revoke all on table public.platos from anon, authenticated;
grant select on table public.platos to anon, authenticated;
grant insert, update, delete on table public.platos to authenticated;
```

### Convención de migraciones

> **Actualizado (02/09/2026).** Ya no es así: la tarea 9 renombró todos los
> archivos a `<timestamp>_nombre.sql` y desde la tarea 8 se aplican con
> `supabase db push --linked`, que además registra lo aplicado en
> `supabase_migrations.schema_migrations`.
>
> El precio de haber mezclado las dos costumbres se cobró al hacer la 8.1: tres
> migraciones aplicadas a mano desde el SQL Editor no constaban como aplicadas,
> y una de ellas —el renombrado de `agregar_admin` a `add_admin`— resultó que no
> se había aplicado nunca, con el front ya llamando al nombre nuevo. Desde aquí,
> **una sola vía**: el CLI. Nada de pegar SQL en el editor.

Lo que sigue vale como historia de por qué:

~~Los archivos de `supabase/migrations/` no llevan prefijo de timestamp, así que
`supabase db push` no los reconoce: se aplican pegándolos en el SQL Editor.~~

---

## 4. El código del panel

### Estructura de carpetas

La estructura actual (`pages/`, `hooks/`, `components/`, `lib/`) aguanta bien
hasta unos 15-20 archivos. A partir de ahí `hooks/` se convierte en un cajón
donde conviven auth, platos y categorías sin relación entre sí.

El cambio natural es **agrupar por dominio, no por tipo de archivo**: `auth/`,
`platos/`, `categorias/`, cada una con sus hooks, componentes y tipos dentro. Lo
que se toca junto vive junto. `components/` y `lib/` quedan para lo
genuinamente compartido.

**No hacerlo por adelantado.** Hacerlo cuando abrir `hooks/` dé pereza.

### El acceso a datos

El patrón actual — un hook por recurso, con `useEffect` + `useState` +
`loading` + `error` y `AbortController` en la limpieza — es correcto y aguanta
para una carta que cambia una vez por semana.

Se quedará corto en un punto muy concreto: **la invalidación**. Se edita un
precio en `/admins/platos/7`, se vuelve a la lista, y la lista muestra el precio
viejo porque su `useEffect` no se ha vuelto a ejecutar. Se resuelve a mano con un
`refetch()` o actualizando el estado local, como en `useAdmins.agregar()`. Con
tres pantallas es llevadero; con diez es una fuente constante de bugs sutiles.

Ese es el síntoma que indica que toca meter **TanStack Query**. No antes: hoy se
pagaría la dependencia y el modelo mental sin cobrar el beneficio.

### Una única suscripción de auth

`useSession()` abre una suscripción por cada componente que lo llama. Hoy la
sesión baja por props desde `App`. Cuando el panel tenga varias pantallas que la
necesiten, el paso siguiente es un `SessionContext`: una suscripción, una fuente
de verdad, y deja de hacer falta pasar `userId` a mano a `useEsAdmin`.

---

## 5. Fotos de los platos

> **Estado (02/09/2026).** El lado de la carta pública ya está hecho: la carta
> es una cuadrícula con una foto por plato, `photo_path` viaja en la consulta y
> `menu/dishPhoto.ts` sabe construir la URL pública. Mientras no haya foto se
> pinta el marco de trama diagonal, que ocupa exactamente lo mismo, así que
> subir la primera foto no mueve la maquetación. **Falta todo lo demás de esta
> sección**: el bucket, sus políticas y la subida desde el panel.

Van a **Supabase Storage**, bucket público `platos/`. En la tabla se guarda solo
la ruta (`foto_path`), no la URL completa: si cambia el dominio del proyecto, las
URLs guardadas se rompen y las rutas no.

Nunca en la base de datos como bytes, y nunca en `src/assets/` — eso obliga a un
despliegue para cambiar una foto, justo lo que el panel viene a evitar.

Storage tiene políticas propias, con la misma lógica de siempre: lectura pública,
escritura apoyada en `is_admin()`.

Detalles que muerden al construirlo: redimensionar en el cliente antes de subir
(las fotos de móvil pesan 5 MB), borrar el archivo viejo al reemplazarlo, y
decidir qué pasa con la foto cuando se borra el plato.

---

## 6. Lo que NO hay que construir

Con tres dueños como usuarios, cada una de estas cosas duplica la complejidad del
panel para un caso que probablemente no ocurra nunca:

- Roles y permisos granulares — admin es admin.
- Historial de cambios / auditoría.
- Borradores y previsualización.
- Papelera con restauración — `disponible` ya cubre el 95%.
- Multi-idioma.
- Editor de texto enriquecido para las descripciones — un `textarea` basta.

`disponible` + `orden` cubren lo que van a hacer a diario.

---

## 7. Orden de construcción

Cada fase deja algo funcionando y visible. Nada de construir tres capas antes de
ver un plato en pantalla.

**Fase 0 — cerrar el acceso** *(hecho, pendiente de aplicar)*
Migración `20260826094521_admins_aprobacion_manual.sql`: fuera el trigger de alta
automática,
permisos revocados, `agregar_admin()` en su sitio.
⚠️ Antes de aplicarla, comprobar que hay al menos una fila en `Admins`; si la
tabla está vacía, nadie podrá volver a entrar nunca.

**Fase 1 — los datos** *(hecho el 02/09/2026)*
`categories` y `dishes` con políticas, grants e índice, en
`20260902204529_menu_tables.sql`. Los platos que hay dentro son todavía los de
ejemplo: faltan los reales del asador (tarea 8.2 de `docs/nextTasks.md`).

**Fase 2 — la carta pública** *(hecho el 02/09/2026)*
La carta de `/` lee de la base de datos desde `useMenu()`. El plato no
disponible no llega siquiera al cliente: lo filtra la política de RLS.

**Fase 3 — el CRUD** *(hecho el 02/09/2026)*
`useDishes`/`useCategories` y las cuatro pantallas del panel. Del `delete` real
solo hay un botón, escondido en la edición y con confirmación.

**Fase 4 — el orden** *(hecho el 02/09/2026)*
`sort_order` editable como número, en `CategoriesPage` y en `DishForm`. Sin
arrastrar y soltar, como estaba decidido.

**Fase 5 — las fotos** *(pendiente, lo único que queda)*
Storage, subida, redimensionado, reemplazo. Es la parte más fiddly: va al final
a propósito.
