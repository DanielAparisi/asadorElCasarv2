import { Link } from 'react-router-dom'
import { formatPrice } from '@/features/menu/formatPrice'
import { useCategories } from '../hooks/useCategories'
import { useDishes } from '../hooks/useDishes'
import AdminButton from '../components/AdminButton'
import AdminHeading from '../components/AdminHeading'

/**
 * The list of dishes: the screen they use every day.
 *
 * Dishes that are off the menu are shown dimmed, never hidden — hiding them
 * would leave no way of putting them back. The switch is one click, right on
 * the row, because taking a dish off is the most frequent thing that happens
 * here and it should not require opening the dish.
 */
function DishesPage() {
  const { dishes, loading, error, toggleAvailable, saving, saveError } = useDishes()
  const categories = useCategories()

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <AdminHeading>Platos</AdminHeading>
        <Link
          to="/admins/platos/nuevo"
          className="ml-auto bg-gray-800 text-white rounded px-4 py-2 text-sm"
        >
          Añadir plato
        </Link>
      </div>

      {saveError && <p className="text-sm text-red-600 mb-4">{saveError}</p>}

      {loading || categories.loading ? (
        <p>Cargando…</p>
      ) : error || categories.error ? (
        <p>Error: {error ?? categories.error}</p>
      ) : dishes.length === 0 ? (
        <p className="text-gray-500">Todavía no hay platos. Añade el primero.</p>
      ) : (
        categories.categories.map((category) => (
          <section key={category.id} className="mb-8">
            <h2 className="font-semibold mb-2">{category.name}</h2>

            <ul className="border-t">
              {dishes
                .filter((dish) => dish.category_id === category.id)
                .map((dish) => (
                  <li
                    key={dish.id}
                    className={`flex items-center gap-4 border-b py-2 ${
                      dish.available ? '' : 'opacity-50'
                    }`}
                  >
                    <Link to={`/admins/platos/${dish.id}`} className="underline">
                      {dish.name}
                    </Link>
                    <span className="ml-auto tabular-nums">{formatPrice(dish.price_cents)}</span>
                    <AdminButton
                      variant="quiet"
                      disabled={saving}
                      onClick={() => toggleAvailable(dish.id)}
                    >
                      {dish.available ? 'Quitar de la carta' : 'Poner en la carta'}
                    </AdminButton>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

export default DishesPage
