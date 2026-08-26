-- ============================================================
-- PASO 1 (OBLIGATORIO): ejecuta SOLO esto primero.
--
-- Si devuelve 0 filas, PARA. Al aplicar el paso 2 se elimina el alta
-- automática de admins, y sin ninguna fila aquí nadie podrá volver a
-- entrar al panel nunca. En ese caso, ejecuta antes el PASO 1b.
-- ============================================================

select id, name, user_id from public."Admins";


-- ============================================================
-- PASO 1b: SOLO si el paso 1 devolvió 0 filas.
-- Cambia el correo por el tuyo (el de la cuenta con la que entras al panel).
-- ============================================================

-- insert into public."Admins" (name, user_id)
-- select u.email, u.id from auth.users u where u.email = 'tu@correo.com'
-- on conflict (user_id) do nothing;


-- ============================================================
-- PASO 2: las dos migraciones, en este orden.
-- Ejecutar solo si el paso 1 ha devuelto al menos una fila.
-- ============================================================

begin;

-- ---------- supabase/migrations/admins_aprobacion_manual.sql ----------

set local check_function_bodies = off;

-- Registrarse deja de dar acceso de admin.
--
-- Antes, cada alta en auth.users creaba automáticamente una fila en Admins, así
-- que el registro público equivalía a un panel público. Ahora la cuenta se crea
-- sin privilegios y es un admin quien da el alta, con public.agregar_admin().
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists private.handle_new_admin();

-- La tabla se lee con RLS y se escribe solo desde agregar_admin(), que corre
-- como owner. Nadie más necesita permisos de escritura sobre Admins.
revoke all on table "public"."Admins" from "anon", "authenticated";
grant select on table "public"."Admins" to "authenticated";

/**
 * Da el alta de admin a la cuenta que tenga ese correo.
 *
 * Es security definer por dos motivos: authenticated no puede leer auth.users
 * para traducir correo → user_id, y la tabla Admins no tiene política de
 * insert. Por eso lo primero que hace es comprobar quién llama.
 *
 * La persona tiene que haberse registrado antes: aquí solo se le añade el
 * privilegio, no se le crea la cuenta.
 */
create or replace function public.agregar_admin(correo text)
  returns public."Admins"
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
declare
  id_usuario uuid;
  fila public."Admins";
begin
  if not private.is_admin() then
    raise exception 'Solo un admin puede dar de alta a otro admin.'
      using errcode = '42501';
  end if;

  select u.id into id_usuario
  from auth.users u
  where lower(u.email) = lower(trim(correo))
  limit 1;

  if id_usuario is null then
    raise exception 'No hay ninguna cuenta con ese correo. Dile que se registre primero.'
      using errcode = 'P0002';
  end if;

  insert into public."Admins" (name, user_id)
  values (lower(trim(correo)), id_usuario)
  on conflict (user_id) do nothing
  returning * into fila;

  if fila is null then
    raise exception 'Esa cuenta ya es admin.'
      using errcode = '23505';
  end if;

  return fila;
end;
$function$;

revoke all on function "public"."agregar_admin"(text) from public, "anon";
grant execute on function "public"."agregar_admin"(text) to "authenticated", "postgres";

-- Sin al menos una fila en Admins nadie puede llamar a agregar_admin() y el
-- panel queda cerrado para siempre. Si la tabla está vacía, descomenta esto con
-- tu correo y ejecútalo una sola vez desde el SQL Editor de Supabase:
--
-- insert into public."Admins" (name, user_id)
-- select u.email, u.id from auth.users u where u.email = 'tu@correo.com'
-- on conflict (user_id) do nothing;

-- ---------- supabase/migrations/seguridad_permisos_por_defecto.sql ----------

set local check_function_bodies = off;

-- Quita los permisos automáticos sobre las tablas futuras.
--
-- La primera migración dejó esto puesto:
--
--   alter default privileges ... grant delete, insert, update ... on tables to anon;
--
-- Es decir: cualquier tabla nueva de `public` nacía con permiso de escritura
-- para visitantes anónimos, y lo único que lo impedía era el RLS. Una tabla
-- creada sin políticas, o con una política mal escrita, quedaba abierta a
-- internet. Defensa en profundidad significa no depender de una sola capa.
--
-- A partir de aquí, cada tabla nueva empieza sin permisos y hay que
-- concedérselos a mano. Es más trabajo, y es deliberado: un olvido deja la
-- tabla inaccesible (fallo evidente) en vez de abierta (fallo silencioso).

alter default privileges for role "postgres" in schema "public"
  revoke all on tables from "anon", "authenticated";

alter default privileges for role "postgres" in schema "public"
  revoke all on sequences from "anon", "authenticated";

-- Ejecutar funciones nuevas sin haberlo decidido es el mismo problema: una
-- función `security definer` recién creada sería llamable por cualquiera.
alter default privileges for role "postgres" in schema "public"
  revoke all on functions from "anon", "authenticated";

-- A partir de ahora, el patrón para cada tabla nueva es explícito:
--
--   grant select on table public.platos to anon, authenticated;
--   grant insert, update, delete on table public.platos to authenticated;
--   -- + sus políticas de RLS
--
-- Para deshacer todo esto (volver al comportamiento anterior):
--
--   alter default privileges for role "postgres" in schema "public"
--     grant delete, insert, references, select, trigger, truncate, update
--     on tables to "anon", "authenticated";
--   alter default privileges for role "postgres" in schema "public"
--     grant select, update, usage on sequences to "anon", "authenticated";
--   alter default privileges for role "postgres" in schema "public"
--     grant execute on functions to "anon", "authenticated";

-- NOTA sobre `force row level security`: NO se activa en Admins a propósito.
-- Forzar el RLS lo aplicaría también al owner de la tabla, y agregar_admin()
-- corre como owner precisamente para poder insertar. Activarlo rompería el alta
-- de admins.

commit;


-- ============================================================
-- PASO 3 (comprobación): que todo quedó como debe.
-- ============================================================

-- El trigger de alta automática ya no existe (debe devolver 0 filas):
select tgname from pg_trigger where tgname = 'on_auth_user_created';

-- La función de alta manual sí existe (debe devolver 1 fila):
select proname from pg_proc where proname = 'agregar_admin';

-- anon ya no puede escribir en Admins (no debe aparecer INSERT/UPDATE/DELETE):
select grantee, privilege_type from information_schema.role_table_grants
where table_name = 'Admins' and grantee in ('anon','authenticated');
