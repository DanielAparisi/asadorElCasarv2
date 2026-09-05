import { PhotoFrame } from '@/shared/components/ui/PhotoFrame'
import { POSTER_BORDER } from '@/shared/components/ui/tokens'
import { dishPhotoUrl } from '@/features/menu/dishPhoto'
import { formatPrice } from '@/features/menu/formatPrice'
import type { Dish } from '@/features/menu/types'

/** Same frame for the photo and for the hatched placeholder that stands in
 *  for it, so the grid does not change shape the day the photos arrive. */
const FRAME = `aspect-square ${POSTER_BORDER} shadow-[9px_9px_0_var(--color-ink)]`

/** One dish of the public menu: photo, name and price. */
function DishCard({ dish }: { dish: Dish }) {
  const photo = dishPhotoUrl(dish.photo_path)

  return (
    <li className="flex flex-col">
      {photo ? (
        <div className={`${FRAME} overflow-hidden`}>
          {/* Lazy, and with the aspect ratio fixed by the frame: the photo
              arriving must not push the rest of the menu down. */}
          <img
            src={photo}
            alt={dish.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <PhotoFrame className={FRAME}>foto · {dish.name.toLowerCase()}</PhotoFrame>
      )}

      <div className="flex items-baseline justify-between gap-3 mt-5.5 border-b-[1.5px] border-ink pb-2">
        <span className="font-title text-[1.5rem] leading-tight tracking-[0.02em] uppercase text-ink max-[560px]:text-[1.375rem]">
          {dish.name}
        </span>
        <span className="font-title text-[1.5rem] leading-tight tracking-[0.02em] uppercase text-red whitespace-nowrap max-[560px]:text-[1.375rem]">
          {formatPrice(dish.price_cents)}
        </span>
      </div>

      {dish.description && (
        <p className="mt-2 text-[0.9375rem] leading-snug text-ink-soft">{dish.description}</p>
      )}
    </li>
  )
}

/**
 * The same card while the dishes are on the wire.
 *
 * It exists for one reason: the menu arrives over the network, and painting a
 * one line "Cargando…" first and then the real grid moves the whole page down
 * — that is a layout shift, and it is what Lighthouse charges for in the CLS.
 * Occupying the final space from the first frame costs nothing and the page
 * stops jumping.
 */
export function DishCardSkeleton() {
  return (
    <li className="flex flex-col" aria-hidden>
      <div className={`${FRAME} bg-cream`} />
      <div className="mt-5.5 h-6 bg-line" />
    </li>
  )
}

export default DishCard
