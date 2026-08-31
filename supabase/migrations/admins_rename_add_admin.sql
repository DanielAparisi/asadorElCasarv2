set local check_function_bodies = off;

/**
 * Renames public.agregar_admin(correo) to public.add_admin(email).
 *
 * Pure rename: the body, the privilege checks and the error messages are the
 * same as in admins_aprobacion_manual.sql. Only the identifiers change, so
 * that the whole codebase — SQL included — is in English.
 *
 * The error messages stay in Spanish: they are shown verbatim to the owners of
 * the restaurant in the panel (see features/admin/hooks/useAdmins.ts).
 *
 * IMPORTANT: apply this before deploying the front end. The client already
 * calls `add_admin`; until this runs, granting admin access fails.
 *
 * It is security definer for two reasons: `authenticated` cannot read
 * auth.users to translate email → user_id, and the Admins table has no insert
 * policy. That is why the very first thing it does is check who is calling.
 *
 * The person must have registered beforehand: this only adds the privilege, it
 * does not create the account.
 */
create or replace function public.add_admin(email text)
  returns public."Admins"
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
declare
  -- Qualified as add_admin.email so plpgsql does not confuse the parameter
  -- with the auth.users.email column further down.
  normalized_email text := lower(trim(add_admin.email));
  target_user_id uuid;
  new_row public."Admins";
begin
  if not private.is_admin() then
    raise exception 'Solo un admin puede dar de alta a otro admin.'
      using errcode = '42501';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception 'No hay ninguna cuenta con ese correo. Dile que se registre primero.'
      using errcode = 'P0002';
  end if;

  insert into public."Admins" (name, user_id)
  values (normalized_email, target_user_id)
  on conflict (user_id) do nothing
  returning * into new_row;

  if new_row is null then
    raise exception 'Esa cuenta ya es admin.'
      using errcode = '23505';
  end if;

  return new_row;
end;
$function$;

revoke all on function "public"."add_admin"(text) from public, "anon";
grant execute on function "public"."add_admin"(text) to "authenticated", "postgres";

-- The old name goes away in the same transaction: leaving both alive means two
-- doors into the same privilege, and only one of them gets reviewed.
drop function if exists public.agregar_admin(text);
