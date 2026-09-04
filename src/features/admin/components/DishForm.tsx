import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category, Dish } from '../../menu/types'
import { centsToPriceInput, parsePriceToCents } from '../../menu/formatPrice'
import type { DishInput } from '../hooks/useDishes'
import AdminButton from './AdminButton'
import AdminField from './AdminField'
import AdminInput, { ADMIN_FIELD_CLASS } from './AdminInput'
import DishPhotoField from './DishPhotoField'

/**
 * The one dish form, used by both the new and the edit screen. Two forms would
 * drift apart the first time a field is added to only one of them.
 *
 * No rich text editor for the description: a textarea is enough
 * (docs/panel.md §6).
 */
function DishForm({
  categories,
  dish,
  onSubmit,
  saving,
  saveError,
  children,
}: {
  categories: Category[]
  /** Absent on the new dish screen. */
  dish?: Dish
  onSubmit: (values: DishInput) => void
  saving: boolean
  saveError: string | null
  /** The delete button of the edit screen, painted under the form. */
  children?: React.ReactNode
}) {
  const [name, setName] = useState(dish?.name ?? '')
  const [description, setDescription] = useState(dish?.description ?? '')
  // Euros as typed, cents on save: the conversion lives in menu/formatPrice.
  const [price, setPrice] = useState(dish ? centsToPriceInput(dish.price_cents) : '')
  const [categoryId, setCategoryId] = useState(dish?.category_id ?? categories[0]?.id)
  const [sortOrder, setSortOrder] = useState(String(dish?.sort_order ?? 0))
  const [available, setAvailable] = useState(dish?.available ?? true)
  const [photoPath, setPhotoPath] = useState<string | null>(dish?.photo_path ?? null)
  const [priceError, setPriceError] = useState<string | null>(null)

  if (categories.length === 0) {
    return (
      <p className="text-gray-500">
        Antes de añadir un plato hace falta al menos una categoría:{' '}
        <Link to="/admins/categorias" className="underline">
          crear una
        </Link>
        .
      </p>
    )
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const priceCents = parsePriceToCents(price)
    if (priceCents === null || categoryId === undefined) {
      setPriceError('Escribe el precio en euros, por ejemplo 12,50.')
      return
    }

    setPriceError(null)
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      price_cents: priceCents,
      category_id: categoryId,
      sort_order: Number(sortOrder) || 0,
      available,
      photo_path: photoPath,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <AdminField label="Nombre">
        <AdminInput required value={name} onChange={(event) => setName(event.target.value)} />
      </AdminField>

      <AdminField label="Descripción">
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={ADMIN_FIELD_CLASS}
        />
      </AdminField>

      <AdminField label="Precio en euros">
        <AdminInput
          required
          inputMode="decimal"
          placeholder="12,50"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </AdminField>

      <AdminField label="Categoría">
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(Number(event.target.value))}
          className={ADMIN_FIELD_CLASS}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </AdminField>

      <AdminField label="Orden dentro de su categoría">
        <AdminInput
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        />
      </AdminField>

      <DishPhotoField photoPath={photoPath} onChange={setPhotoPath} />

      <label className="flex items-center gap-2 mb-6 text-sm">
        <input
          type="checkbox"
          checked={available}
          onChange={(event) => setAvailable(event.target.checked)}
        />
        En la carta
      </label>

      {priceError && <p className="text-sm text-red-600 mb-3">{priceError}</p>}
      {saveError && <p className="text-sm text-red-600 mb-3">{saveError}</p>}

      <div className="flex items-center gap-3">
        <AdminButton type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </AdminButton>
        <Link to="/admins" className="text-sm underline text-gray-500">
          Cancelar
        </Link>
      </div>

      {children}
    </form>
  )
}

export default DishForm
