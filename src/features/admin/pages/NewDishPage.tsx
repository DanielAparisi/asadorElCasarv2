import { Link, useNavigate } from 'react-router-dom'
import DishForm from '../components/DishForm'
import AdminHeading from '../components/AdminHeading'
import { useCategories } from '../hooks/useCategories'
import { useDishes } from '../hooks/useDishes'
import type { DishInput } from '../hooks/useDishes'

/** Creating a dish: the same DishForm as the edit screen, with empty values. */
function NewDishPage() {
  const { createDish, saving, saveError } = useDishes()
  const { categories, loading, error } = useCategories()
  const navigate = useNavigate()

  async function handleSubmit(values: DishInput) {
    const created = await createDish(values)
    // Back to the list, which mounts again and reads the dish that was just
    // inserted. Staying here after saving is how you get duplicates.
    if (created) navigate('/admins')
  }

  return (
    <div>
      <Link to="/admins" className="text-sm underline text-gray-500">
        ← Volver a platos
      </Link>

      <div className="mt-4 mb-6">
        <AdminHeading>Nuevo plato</AdminHeading>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <DishForm
          categories={categories}
          onSubmit={handleSubmit}
          saving={saving}
          saveError={saveError}
        />
      )}
    </div>
  )
}

export default NewDishPage
