import { dishPhotoUrl } from '@/features/menu/dishPhoto'
import { useDishPhoto } from '../hooks/useDishPhoto'

/**
 * The photo of a dish: what there is, a file picker, and a way to remove it.
 *
 * The upload happens when the file is chosen, not when the form is saved. The
 * shrinking plus the round trip take a couple of seconds on a phone, and doing
 * it on submit would freeze the save behind a progress the admin cannot see.
 * This way they pick the photo, watch it appear, and then save.
 *
 * The price is that a photo chosen and then abandoned without saving leaves a
 * file in the bucket that no row points at. It is a few kB, it happens rarely,
 * and the alternative —holding the file in memory until submit— makes the save
 * the slow, failure-prone step instead of the fast one.
 */
function DishPhotoField({
  photoPath,
  onChange,
}: {
  photoPath: string | null
  onChange: (path: string | null) => void
}) {
  const { uploadPhoto, uploading, uploadError } = useDishPhoto()
  const url = dishPhotoUrl(photoPath)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const path = await uploadPhoto(file)
    // The input is cleared either way: leaving the file name in it after a
    // failure suggests something was uploaded, and picking the same file twice
    // after a failure would not fire `change` again.
    event.target.value = ''
    if (path) onChange(path)
  }

  return (
    <div className="mb-4">
      <span className="block text-sm text-gray-600 mb-1">Foto</span>

      {url && (
        <img
          src={url}
          alt=""
          className="w-32 h-32 object-cover border mb-2"
          // It is the same photo the public menu paints, at the same size the
          // card paints it. If it looks wrong here, it looks wrong there.
        />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={uploading}
        className="block text-sm"
      />

      <p className="text-xs text-gray-500 mt-1">
        Se reduce y se convierte a WebP en el navegador antes de subirla, así que
        da igual que venga del móvil.
      </p>

      {uploading && <p className="text-sm text-gray-500 mt-1">Subiendo…</p>}
      {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}

      {photoPath && !uploading && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-sm underline text-gray-500 mt-1"
        >
          Quitar la foto
        </button>
      )}
    </div>
  )
}

export default DishPhotoField
