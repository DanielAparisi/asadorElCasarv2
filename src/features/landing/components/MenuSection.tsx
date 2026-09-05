import { useMenu } from '@/features/menu/hooks/useMenu'
import { Heading } from '@/shared/components/ui/Heading'
import { Tag } from '@/shared/components/ui/Tag'
import DishCard, { DishCardSkeleton } from './DishCard'

/**
 * The public menu: a grid of dishes with a photo, grouped by category.
 *
 * It used to be a flat price list in a narrow column. With a photo per dish it
 * needs the full width, and the categories stop being decoration: without a
 * heading between them, four categories are forty cards in a row with nothing
 * separating them (docs/cleanCode.md §0.2).
 *
 * It brings neither the width nor the container: whoever places it decides
 * that, which is what lets the page be reordered without touching the section.
 */
function MenuSection() {
  const { dishes, categories, loading, error } = useMenu()

  return (
    <section id="la-carta" className="pt-16 scroll-mt-6 max-[900px]:pt-12">
      <Tag>La carta</Tag>
      <Heading className="mt-5 mb-9 text-[3.75rem] leading-[0.94] max-[900px]:text-[2.75rem] max-[560px]:text-[2.375rem]">
        Nuestros clásicos
      </Heading>

      {/* Since useMenu reads from Supabase, the wait and the failure are real:
          without these two branches a network error leaves the menu blank for
          ever and says nothing. */}
      {loading ? (
        <ul
          className="grid grid-cols-3 gap-x-6.5 gap-y-11 m-0 p-0 list-none max-[900px]:grid-cols-2 max-[560px]:grid-cols-1"
          // Announced once for screen readers, which get nothing out of six
          // grey rectangles.
          role="status"
          aria-label="Cargando la carta"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <DishCardSkeleton key={index} />
          ))}
        </ul>
      ) : error ? (
        <p className="font-mono text-xs tracking-[0.04em] text-ink-mute">
          No hemos podido cargar la carta ahora mismo. Llámanos y te la contamos.
        </p>
      ) : (
        categories.map((category) => {
          const dishesOfCategory = dishes.filter((dish) => dish.category_id === category.id)
          // An empty category is a category whose dishes are all off the menu:
          // its heading alone would look like something failed to load.
          if (dishesOfCategory.length === 0) return null

          return (
            <div key={category.id} className="mb-14 last:mb-0 max-[900px]:mb-11">
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink border-t-[3px] border-ink pt-3 mb-7">
                {category.name}
              </h3>

              <ul className="grid grid-cols-3 gap-x-6.5 gap-y-11 m-0 p-0 list-none max-[900px]:grid-cols-2 max-[900px]:gap-y-9 max-[560px]:grid-cols-1">
                {dishesOfCategory.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </ul>
            </div>
          )
        })
      )}

      {/* Placeholder notice: it comes out with the real prices, in task 8.2. */}
      <p className="mt-9 font-mono text-xs tracking-[0.04em] text-ink-mute">
        Precios de ejemplo — sustituir por los reales.
      </p>
    </section>
  )
}

export default MenuSection
