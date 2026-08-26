set local check_function_bodies = off;

create or replace function private.handle_new_admin()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
begin
  insert into public."Admins" (name, user_id)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), new.email), new.id);
  return new;
end;
$function$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_admin();

grant execute on function "private"."handle_new_admin"() to "postgres";

