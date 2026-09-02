import { supabase } from '../../shared/lib/supabase'

/**
 * The public URL of a dish photo, or null while it has none.
 *
 * The table stores the path inside the bucket (`8f3a-pollo.jpg`) and never the
 * full URL: if the project domain changes, stored URLs break and paths do not.
 * Building it is the client's job, and this is the one place that knows the
 * bucket's name.
 *
 * ⚠️ The bucket does not exist yet — uploading photos is phase 5 of
 * docs/panel.md, and `photo_path` is null in every row today, so this never
 * runs. It is written now so that the day the first photo is uploaded, the
 * public menu paints it without touching anything else. `getPublicUrl` only
 * builds a string; it makes no request.
 */
export const DISH_PHOTOS_BUCKET = 'dishes'

export function dishPhotoUrl(photoPath: string | null) {
  if (!photoPath) return null

  return supabase.storage.from(DISH_PHOTOS_BUCKET).getPublicUrl(photoPath).data.publicUrl
}
