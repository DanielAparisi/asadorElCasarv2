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
