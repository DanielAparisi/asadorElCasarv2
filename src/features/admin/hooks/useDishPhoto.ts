import { useState } from 'react'
import { supabase } from '../../../shared/lib/supabase'
import { DISH_PHOTOS_BUCKET } from '../../menu/dishPhoto'
import { shrinkImage } from '../lib/shrinkImage'

/**
 * Uploading and deleting a dish photo.
 *
 * Apart from useDishes because it is the one operation of the panel that does
 * not touch Postgres: what it writes is a file, and what ends up in the row is
 * only its path. Keeping it here also keeps `shrinkImage` and the bucket's
 * name out of the form, which then only has to hold a string.
 *
 * The file name is a random UUID and never the dish's name. Two dishes called
 * "Pollo entero" would collide; an accent or a slash in the name would produce
 * a path that Storage rejects; and reusing a name across a replacement leaves
 * the CDN serving the old photo from its cache. A new name every time makes
 * every upload a new URL.
 */
export function useDishPhoto() {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  /** The new path, or null if it failed. */
  async function uploadPhoto(file: File): Promise<string | null> {
    setUploading(true)
    setUploadError(null)

    try {
      const blob = await shrinkImage(file)
      const path = `${crypto.randomUUID()}.webp`

      const { error } = await supabase.storage
        .from(DISH_PHOTOS_BUCKET)
        .upload(path, blob, { contentType: 'image/webp' })

      if (error) throw new Error(error.message)

      return path
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : 'No se pudo subir la foto.')
      return null
    } finally {
      setUploading(false)
    }
  }

  /**
   * Deletes a photo, and says nothing if it cannot.
   *
   * It is always called after the row has already been saved or deleted, so by
   * then the photo is unreachable from the menu whatever happens here. A file
   * left behind in the bucket costs a few kilobytes; an error shown after a
   * successful save would tell the admin their change did not go through, and
   * it did.
   */
  async function removePhoto(path: string) {
    await supabase.storage.from(DISH_PHOTOS_BUCKET).remove([path])
  }

  return { uploadPhoto, removePhoto, uploading, uploadError }
}
