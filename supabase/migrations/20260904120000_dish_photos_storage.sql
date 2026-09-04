/**
 * Storage for the dish photos: the `dishes` bucket and its policies.
 *
 * The bucket is named after the table, not `platos`: docs/panel.md still
 * called it that from before the rename of 31/08/2026, but
 * `menu/dishPhoto.ts` has been building `/dishes/` URLs since it was written.
 * The code was already right; this is the file that settles it.
 *
 * Public bucket. The photos of a menu are as public as the prices next to
 * them, and a private bucket would mean signing every URL — a signed URL
 * expires, and a menu whose photos stop loading after an hour is worse than no
 * menu. What is protected is *writing*, which is the same two-policy mould as
 * the tables: everyone reads, only admins write.
 *
 * The limits are the second line of defence, not the first. The panel shrinks
 * every photo to WebP before uploading (features/admin/lib/shrinkImage.ts), so
 * nothing legitimate gets near 1 MB. These stop the day someone uploads
 * straight from a phone with `curl` and the browser is not there to shrink
 * anything.
 */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dishes', 'dishes', true, 1048576, array['image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Same mould as `public.dishes`. `storage.objects` already has RLS enabled by
-- Supabase, so only the policies are needed.
create policy "fotos publicas" on "storage"."objects"
  for select to "anon", "authenticated"
  using (bucket_id = 'dishes');

create policy "admins suben fotos" on "storage"."objects"
  for all to "authenticated"
  using (bucket_id = 'dishes' and (select private.is_admin()))
  with check (bucket_id = 'dishes' and (select private.is_admin()));
