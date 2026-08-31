import { formatPrice } from '../../menu/formatPrice'
import { useMenu } from '../../menu/hooks/useMenu'
import { Heading } from '../../../shared/components/ui/Heading'
import { Tag } from '../../../shared/components/ui/Tag'

/**
 * The public menu: a price list, one row per dish.
 *
 * It brings neither the grid nor the width: whoever places it decides that,
 * which is what lets the page be reordered without touching the section.
 */
function MenuSection() {
  const { dishes } = useMenu()

  return (
    <div id="la-carta" className="scroll-mt-6">
      <Tag>La carta</Tag>
      <Heading className="mt-5 mb-6 text-[3.75rem] leading-[0.94] max-[900px]:text-[2.75rem] max-[560px]:text-[2.375rem]">
        Nuestros clásicos
      </Heading>

      <ul className="m-0 p-0 list-none border-t-[3px] border-ink">
        {dishes.map((dish) => (
          <li
            key={dish.id}
            className="flex items-baseline justify-between gap-4.5 px-1 py-3.75
              border-b-[1.5px] border-ink last:border-b-[3px]"
          >
            <span className="font-title text-[1.75rem] tracking-[0.02em] uppercase text-ink max-[560px]:text-[1.375rem]">
              {dish.name}
            </span>
            <span className="font-title text-[1.75rem] tracking-[0.02em] uppercase text-red whitespace-nowrap max-[560px]:text-[1.375rem]">
              {formatPrice(dish.price_cents)}
            </span>
          </li>
        ))}
      </ul>

      {/* Placeholder notice: it comes out with the real prices, in phase 1. */}
      <p className="mt-4 font-mono text-xs tracking-[0.04em] text-ink-mute">
        Precios de ejemplo — sustituir por los reales.
      </p>
    </div>
  )
}

export default MenuSection
