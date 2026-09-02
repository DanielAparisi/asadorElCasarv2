import { Link, useNavigate, useParams } from 'react-router-dom'
import NotFoundPage from '../../../shared/pages/NotFoundPage'
import DishForm from '../components/DishForm'
import AdminButton from '../components/AdminButton'
import AdminHeading from '../components/AdminHeading'
import { useCategories } from '../hooks/useCategories'
import { useDishes } from '../hooks/useDishes'
import type { DishInput } from '../hooks/useDishes'

/**
 * Editing a dish.
 *
 * The dish is taken from the list the hook already loads instead of a second
 * query for one row: the panel needs the list anyway, and this way the form
 * and the list can never disagree about the same dish.
 */
function EditDishPage() {
  const { id } = useParams()
  const { dishes, loading, error, updateDish, deleteDish, saving, saveError } = useDishes()
  const categories = useCategories()
  const navigate = useNavigate()

  const dish = dishes.find((candidate) => String(candidate.id) === id)

  if (loading || categories.loading) return <p>Cargando…</p>
  if (error || categories.error) return <p>Error: {error ?? categories.error}</p>
  // An id that does not exist is a 404, not an empty form that would silently
  // create a second dish on save.
  if (!dish) return <NotFoundPage />

  // Declared as consts after the guard above so `dish` is narrowed inside
  // them: a hoisted `function` would be analysed before the check and need a
  // non-null assertion.
  const handleSubmit = async (values: DishInput) => {
    const updated = await updateDish(dish.id, values)
    if (updated) navigate('/admins')
  }

  /**
   * Deleting is for typos, not for taking a dish off the menu — that is the
   * switch in the list. Hence: down here, and with a confirmation.
   */
  const handleDelete = async () => {
    if (!confirm(`¿Borrar "${dish.name}" para siempre? Esto no se puede deshacer.`)) return
    const deleted = await deleteDish(dish.id)
    if (deleted) navigate('/admins')
  }

  return (
    <div>
      <Link to="/admins" className="text-sm underline text-gray-500">
        ← Volver a platos
      </Link>

      <div className="mt-4 mb-6">
        <AdminHeading>Editar plato</AdminHeading>
      </div>

      <DishForm
        categories={categories.categories}
        dish={dish}
        onSubmit={handleSubmit}
        saving={saving}
        saveError={saveError}
      >
        <div className="border-t mt-8 pt-4">
          <AdminButton type="button" variant="quiet" disabled={saving} onClick={handleDelete}>
            Borrar este plato
          </AdminButton>
          <p className="text-sm text-gray-500 mt-2">
            Para quitarlo de la carta sin perderlo, desmarca «En la carta».
          </p>
        </div>
      </DishForm>
    </div>
  )
}

export default EditDishPage
