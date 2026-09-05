import { useState } from 'react'
import type { Category } from '@/features/menu/types'
import { useCategories } from '../hooks/useCategories'
import AdminButton from '../components/AdminButton'
import AdminHeading from '../components/AdminHeading'
import AdminInput from '../components/AdminInput'

/**
 * Menu categories: names and ordering.
 *
 * No drag and drop. An editable number solves 90% of the problem; the dragging
 * only if they ask for it after using this for a month (docs/panel.md §4).
 */
function CategoriesPage() {
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    saving,
    saveError,
  } = useCategories()
  const [name, setName] = useState('')

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    // At the end by default: a new category should not push the whole menu
    // around until someone says where it goes.
    const created = await createCategory({
      name: name.trim(),
      sort_order: categories.length + 1,
    })
    if (created) setName('')
  }

  async function handleDelete(category: Category) {
    if (!confirm(`¿Borrar la categoría "${category.name}"?`)) return
    await deleteCategory(category.id)
  }

  return (
    <div>
      <div className="mb-6">
        <AdminHeading>Categorías</AdminHeading>
      </div>

      {saveError && <p className="text-sm text-red-600 mb-4">{saveError}</p>}

      {loading ? (
        <p>Cargando…</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500 mb-8">
          Todavía no hay categorías. Crea la primera.
        </p>
      ) : (
        <ul className="mb-8 border-t max-w-md">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center gap-3 border-b py-2"
            >
              <AdminInput
                defaultValue={category.name}
                disabled={saving}
                // On blur and not on every keystroke: one write per edit
                // instead of one per letter.
                onBlur={(event) =>
                  event.target.value !== category.name &&
                  updateCategory(category.id, { name: event.target.value })
                }
              />
              <AdminInput
                type="number"
                defaultValue={category.sort_order}
                disabled={saving}
                className="w-20"
                onBlur={(event) =>
                  Number(event.target.value) !== category.sort_order &&
                  updateCategory(category.id, {
                    sort_order: Number(event.target.value),
                  })
                }
              />
              <AdminButton
                variant="quiet"
                disabled={saving}
                onClick={() => handleDelete(category)}
              >
                Borrar
              </AdminButton>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreate} className="max-w-md border-t pt-6">
        <h2 className="font-semibold mb-3">Nueva categoría</h2>

        <div className="flex gap-2">
          <AdminInput
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Postres"
          />
          <AdminButton type="submit" disabled={saving}>
            {saving ? 'Añadiendo…' : 'Añadir'}
          </AdminButton>
        </div>
      </form>
    </div>
  )
}

export default CategoriesPage
