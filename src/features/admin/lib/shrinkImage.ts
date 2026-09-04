/**
 * A photo, shrunk and turned into WebP, ready to upload.
 *
 * This is the whole of "option B": there is no image CDN transforming anything
 * on the way out, so the resizing happens once, here, before the file ever
 * leaves the browser. A 5 MB photo straight from a phone comes out around
 * 60 kB, and that is what every visitor of the menu downloads from then on.
 *
 * One size and no `srcset` on purpose: the photos are painted by DishCard
 * inside an `aspect-square` in a grid — fixed-size square thumbnails, the same
 * on every viewport. 800 px covers the largest of them at 2x on a retina
 * screen. The day there is a full-width photo, this is the file that has to
 * grow, and Supabase's transformations become worth their price.
 */

/** The long side, in CSS pixels. Twice the biggest the card is ever painted. */
const MAX_SIDE = 800

/** WebP at 0.8 is where the artefacts stop being visible on a photo. */
const QUALITY = 0.8

export async function shrinkImage(file: File): Promise<Blob> {
  // `imageOrientation: 'from-image'` is not optional. Phones do not rotate the
  // pixels, they write the orientation in the EXIF and let the viewer rotate;
  // a canvas ignores that, so without this every photo taken in portrait is
  // uploaded lying on its side. The bug is invisible in testing because the
  // pictures dragged in from a laptop have no EXIF to begin with.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  // Never upscale: a small photo stays the size it is rather than being blown
  // up into a blurry 800 px one.
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo procesar la imagen.')

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  // The decoded bitmap can be tens of MB; without this it waits for the GC.
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALITY),
  )

  // `toBlob` answers null when the format is not supported. Every browser that
  // can run this panel writes WebP, but the type says it can fail and a silent
  // null here would upload `undefined`.
  if (!blob) throw new Error('El navegador no pudo convertir la imagen a WebP.')

  return blob
}
