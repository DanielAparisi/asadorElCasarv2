# RLS y migraciones en Supabase

Dos cosas que se confunden a menudo y no son lo mismo:

- **RLS** es *quién puede ver o tocar qué filas*. Vive dentro de Postgres y se
  ejecuta en el servidor, así que nadie lo esquiva desde el navegador.
- **Las migraciones** son *cómo llegó la base de datos a su estado actual*. Son
  ficheros `.sql` que se aplican en orden. No protegen nada por sí mismas: son
  el historial.

Este documento explica lo primero y, al final, dice exactamente qué migraciones
te faltan por aplicar en el proyecto remoto.

Complementa a [seguridad.md](./seguridad.md), que explica *por qué* la frontera
está en el RLS y no en el guard de React. Aquí se explica *cómo funciona* el
mecanismo.

---

## 1. Las dos capas: GRANT y RLS

Para que una petición desde el navegador llegue a una fila tiene que pasar
**dos puertas**. Fallar cualquiera de las dos devuelve cero filas.

### Puerta 1 — el `GRANT` (permiso sobre la tabla)

Postgres primero pregunta: *¿este rol tiene permiso sobre esta tabla, en
absoluto?* Es todo o nada, no mira filas.

```sql
grant select on table public.dishes to anon, authenticated;
grant insert, update, delete on table public.dishes to authenticated;
```

Sin esto, da igual lo perfectas que sean tus políticas: PostgREST devuelve
`permission denied for table dishes`.

### Puerta 2 — el RLS (política sobre las filas)

Solo si pasas la puerta 1, Postgres evalúa las políticas para decidir **qué
filas concretas** te deja ver o escribir.

```sql
alter table public.dishes enable row level security;

create policy "carta publica" on public.dishes
  for select to anon, authenticated
  using (available);
```

**El detalle que hay que interiorizar:** activar RLS sin escribir ninguna
política no deja la tabla "abierta" — la deja **cerrada del todo**. El
comportamiento por defecto con RLS activo es *denegar*. Una política es un
permiso que *añades*, nunca una restricción que quitas.

Y las políticas se combinan con **OR**, no con AND. Si una fila casa con
cualquier política aplicable, pasa. Por eso en este proyecto un admin ve también
los platos con `available = false`: la política `"carta publica"` no le vale
(el plato no está disponible), pero `"admins escriben"` es `for all` y sí casa.

### Por qué las dos, si con una bastaría

Podrías dejar los `GRANT` abiertos y confiar solo en el RLS. Este proyecto
decidió expresamente que no, y la migración
`20260826100433_seguridad_permisos_por_defecto.sql` existe justo para eso: la
primerísima migración dejó puesto un `alter default privileges ... grant insert,
update, delete on tables to anon`, es decir, **toda tabla nueva de `public`
nacía escribible por visitantes anónimos** y lo único que lo impedía era el RLS.

Una tabla creada sin políticas, o con una política mal escrita, quedaba abierta
a internet. Con las dos capas, un olvido deja la tabla *inaccesible* (fallo
evidente, te enteras enseguida) en vez de *abierta* (fallo silencioso, te
enteras en Twitter).

---

## 2. Los roles de Supabase

Cada petición a la API llega a Postgres como uno de estos roles, según el JWT
que lleve:

| Rol | Quién es | Cuándo |
|---|---|---|
| `anon` | visitante sin sesión | clave publicable, nadie ha iniciado sesión |
| `authenticated` | cualquiera con sesión iniciada | clave publicable + JWT de usuario |
| `service_role` | el backend | clave secreta — **se salta el RLS por completo** |
| `postgres` | el owner | SQL Editor del dashboard, migraciones |

Tres consecuencias prácticas:

1. **La clave `service_role` nunca puede estar en el front.** En este proyecto
   todo lo que sale del navegador va con la clave publicable; cualquier variable
   `VITE_*` acaba en el bundle y es pública por definición.
2. **`authenticated` significa "tiene cuenta", no "tiene permiso".** Cualquiera
   puede registrarse. Por eso ninguna política de este repo se conforma con
   `to authenticated`: todas añaden además una condición (`private.is_admin()`,
   o la propiedad de la fila). Una política que solo comprueba el rol es el
   agujero clásico — cualquier usuario registrado lee los datos de todos.
3. **Lo que ejecutas en el SQL Editor va como `postgres`**, que se salta el RLS.
   Que una consulta te funcione ahí no dice absolutamente nada sobre si le
   funcionará a un visitante.

---

## 3. Anatomía de una política

```sql
create policy "nombre legible"      -- solo documentación
  on public.dishes
  for select                        -- select | insert | update | delete | all
  to authenticated                  -- a qué roles aplica
  using ( ... )                     -- filtro sobre las filas QUE YA EXISTEN
  with check ( ... );               -- validación de las filas QUE VAS A ESCRIBIR
```

`using` y `with check` son la parte que se resiste. La regla corta:

- `using` → **filas que lees**. Se aplica a `select`, y también a `update` y
  `delete` para decidir *qué filas puedes tocar*.
- `with check` → **filas que dejas escritas**. Se aplica a `insert` y `update`,
  sobre el valor *resultante*.

Las tres trampas que de verdad muerden:

**`update` necesita también política de `select`.** Postgres tiene que leer la
fila antes de modificarla. Sin política de lectura, el update no da error:
devuelve cero filas modificadas y el front se queda tan tranquilo pensando que
guardó.

**`update` sin `with check` permite regalar filas.** Con solo `using`,
compruebas que la fila *era* tuya, no que *siga siéndolo* después. Alguien puede
cambiarle el `user_id` a otra persona. Van siempre en pareja.

**Las vistas se saltan el RLS por defecto.** Una `view` corre con los permisos de
quien la creó (`postgres`), no de quien la consulta — es la forma más silenciosa
de publicar una tabla protegida. Si creas alguna, siempre:

```sql
create view public.mi_vista with (security_invoker = true) as ...;
```

---

## 4. El molde de este proyecto

Aquí no hay que inventar nada: todas las tablas siguen el mismo patrón de dos
políticas. Todo el mundo lee, solo los admins escriben.

```sql
-- 1. Activar RLS (en realidad ya lo hace solo, ver más abajo)
alter table public.mi_tabla enable row level security;

-- 2. Lectura pública
create policy "carta publica" on public.mi_tabla
  for select to anon, authenticated
  using (true);

-- 3. Escritura solo admins
create policy "admins escriben" on public.mi_tabla
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 4. Los GRANT, explícitos, porque ya no se heredan
revoke all on table public.mi_tabla from anon, authenticated;
grant select on table public.mi_tabla to anon, authenticated;
grant insert, update, delete on table public.mi_tabla to authenticated;
```

Cuatro cosas que conviene saber sobre este molde:

**`private.is_admin()` vive en el esquema `private`.** Ese esquema **no lo
expone PostgREST**, así que la función no es llamable desde la API: solo desde
dentro de las políticas. Es `security definer` con `set search_path to ''` —
sin esa línea, alguien con permiso para crear objetos podría colocar una tabla
`Admins` falsa en un esquema anterior en el `search_path` y hacerse admin.

**El `(select ...)` alrededor de la llamada no es cosmético.** Envuelto así,
Postgres lo evalúa **una vez por consulta** en vez de una vez por fila. En una
tabla de 60 platos da igual; en una de 60.000 es la diferencia entre 20 ms y
varios segundos. Cuesta lo mismo escribirlo bien.

**`using (true)` en lectura, no copiado a ciegas.** `categories` lee con
`using (true)` porque no tiene columna `available`. `dishes` lee con
`using (available)`, y por eso los platos fuera de carta no salen nunca de la
base de datos hacia la web pública. Copiar el molde sin mirar es el error fácil.

**El RLS se activa solo.** Hay un event trigger, `ensure_rls`, que hace
`enable row level security` sobre cada tabla nueva de `public`. Es una red de
seguridad, no una excusa: activa el RLS pero **no escribe políticas**, así que
una tabla nueva sin políticas devuelve cero filas a todo el mundo. Si creas una
tabla y "no funciona nada", esta es la razón el 90 % de las veces.

**`Admins` no tiene `force row level security` a propósito.** Forzarlo aplicaría
el RLS también al owner de la tabla, y `public.add_admin()` corre como owner
precisamente para poder insertar. Activarlo rompería el alta de admins.

---

## 5. Las migraciones de este proyecto

Ocho ficheros en `supabase/migrations/`, en orden cronológico. Qué hace cada uno:

| Fichero | Qué hace |
|---|---|
| `20260825235901_admins_rls.sql` | Crea el esquema `private`, la tabla `Admins`, la función `private.is_admin()` y el event trigger `ensure_rls`. |
| `20260826000258_admins_signup_trigger.sql` | Trigger que hacía admin a todo el que se registrara. **Anulado por la siguiente.** |
| `20260826094521_admins_aprobacion_manual.sql` | Quita ese trigger (registrarse ya no da acceso) e introduce `agregar_admin(correo)`: el alta la da un admin existente. |
| `20260826100433_seguridad_permisos_por_defecto.sql` | Quita los `GRANT` automáticos sobre tablas futuras. A partir de aquí cada tabla nueva empieza sin permisos. |
| `20260831093559_admins_rename_add_admin.sql` | Renombra `agregar_admin(correo)` → `add_admin(email)`. Solo cambian los identificadores. |
| `20260902204529_menu_tables.sql` | Crea `categories` y `dishes` con sus índices, políticas, grants, trigger de `updated_at` y datos de ejemplo. |
| `20260902212555_drop_plates.sql` | Borra `plates`, el prototipo que `dishes` sustituyó. Arrastraba grants de escritura para `anon`. |
| `20260904120000_dish_photos_storage.sql` | Crea el bucket `dishes` de Storage (público, 1 MB, solo WebP) y sus políticas de escritura para admins. |

### Estado real ahora mismo (comprobado el 07/09/2026)

**Las seis primeras ya están aplicadas** en el proyecto remoto
(`dctddnxvhvbeiyfnxnxj`). **Las dos últimas no.**

```
20260902212555_drop_plates.sql          ❌ PENDIENTE
20260904120000_dish_photos_storage.sql  ❌ PENDIENTE
```

Consecuencias de que falten:

- `public.plates` sigue existiendo en producción, con permisos de `insert`,
  `update` y `delete` para `anon` heredados de antes de la migración de
  permisos. Hoy lo tapa el RLS (tiene RLS activo y ninguna política), pero es
  exactamente la única-capa-de-defensa que este proyecto decidió no usar.
- **El bucket `dishes` de Storage no existe.** Cualquier subida de foto desde el
  panel falla, y `menu/dishPhoto.ts` genera URLs que dan 404.

---

## 6. Cómo aplicar las dos que faltan

### Opción A — desde el SQL Editor (si no quieres CLI)

Dashboard → SQL Editor → New query. **Una migración por ejecución y en este
orden.** Primero el contenido íntegro de `20260902212555_drop_plates.sql`:

```sql
drop table if exists public."plates";
```

Y después el de `20260904120000_dish_photos_storage.sql`:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dishes', 'dishes', true, 1048576, array['image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "fotos publicas" on "storage"."objects"
  for select to "anon", "authenticated"
  using (bucket_id = 'dishes');

create policy "admins suben fotos" on "storage"."objects"
  for all to "authenticated"
  using (bucket_id = 'dishes' and (select private.is_admin()))
  with check (bucket_id = 'dishes' and (select private.is_admin()));
```

⚠️ Aplicarlas así **no queda registrado** en la tabla de historial
(`supabase_migrations.schema_migrations`), así que la CLI seguirá creyendo que
están pendientes. Para sincronizar el historial sin volver a ejecutar el SQL:

```bash
npx supabase migration repair --status applied 20260902212555
npx supabase migration repair --status applied 20260904120000
```

### Opción B — con la CLI (una línea)

```bash
npx supabase db push
```

Aplica todo lo pendiente en orden y actualiza el historial. Es lo que hay que
usar mientras las migraciones sigan en el repositorio.

### Verificar que ha ido bien

```bash
npx supabase migration list --linked   # las 8, en Local y en Remote
```

Y en el SQL Editor:

```sql
-- plates ya no existe → 0 filas
select tablename from pg_tables
where schemaname = 'public' and tablename = 'plates';

-- el bucket existe y es público → 1 fila
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'dishes';

-- las dos políticas de storage → 2 filas
select policyname from pg_policies
where schemaname = 'storage' and tablename = 'objects';
```

La prueba de verdad es la de siempre: **subir una foto desde el panel** y ver
que se muestra en la carta pública.

---

## 7. Comprobaciones de RLS que merece la pena repetir

```sql
-- Tablas de public sin RLS activado. Debe devolver 0 filas.
select tablename from pg_tables t
where schemaname = 'public'
  and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity
  );

-- Tablas con RLS pero sin ninguna política (devuelven 0 filas a todo el mundo).
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and not exists (select 1 from pg_policies p
                  where p.schemaname = 'public' and p.tablename = c.relname);

-- Quién puede escribir en qué.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
order by grantee, table_name;
```

Y el chequeo automático de Supabase, que encuentra vistas `security definer`,
tablas sin RLS y funciones con `search_path` mutable:

```bash
npx supabase db advisors --linked
```

---

## 8. Si dejas de versionar las migraciones

Decisión aparte, pero afecta a todo lo anterior. Si sacas `supabase/migrations/`
del repositorio, el flujo pasa a ser:

1. Cambios de esquema **siempre en el SQL Editor** del dashboard.
2. **Siempre después:** `npm run types:db`, y commitear
   `src/shared/lib/database.types.ts`. Ese fichero pasa a ser el único registro
   del esquema que queda en el repo; sin él no queda nada.
3. Con cada tabla nueva, aplicar el molde de la §4 **entero** — políticas *y*
   grants. Sin migraciones que revisar en un PR, nadie va a darse cuenta de que
   falta la mitad.
4. `npx supabase db advisors --linked` de vez en cuando, que es lo único que
   sustituye a esa revisión.

Lo que pierdes: `supabase db reset` para levantar una base local idéntica, y la
posibilidad de saber por qué el esquema es como es. La tabla
`supabase_migrations.schema_migrations` del remoto conserva su historial pase lo
que pase, y `npx supabase db pull` te regenera un fichero con el esquema
completo si algún día te arrepientes.

**Antes de quitarlas, aplica las dos que faltan.** Si borras los ficheros
ahora, `drop_plates` y `dish_photos_storage` no se aplicarán nunca y el bucket
de fotos no llegará a existir.
