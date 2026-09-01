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
