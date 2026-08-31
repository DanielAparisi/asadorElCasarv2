import { PhotoFrame } from '../../../shared/components/ui/PhotoFrame'
import { Tag } from '../../../shared/components/ui/Tag'

/**
 * Photo gallery of the grill.
 *
 * The photos are hatched placeholders until real images exist. Each one gets a
 * small, distinct rotation: that is what stops the grid from reading as a
 * table and gives it the look of hand-stuck prints.
 *
 * The three size steps exist so the third photo is never orphaned: at two
 * columns it spans the full width, at one it returns to a normal row.
 */

const PHOTOS = [
  { caption: 'foto · parrilla', tilt: '-rotate-[1.1deg]', wide: false },
  { caption: 'foto · pollos', tilt: 'rotate-[0.7deg]', wide: false },
  { caption: 'foto · mesa', tilt: '-rotate-[0.5deg]', wide: true },
]

function GallerySection() {
  return (
    <section id="fotos" className="pt-14.5 scroll-mt-6 max-[900px]:pt-11">
      <Tag red>La brasa</Tag>

      <div className="grid grid-cols-3 gap-6.5 mt-5 max-[900px]:grid-cols-2 max-[900px]:gap-5 max-[560px]:grid-cols-1">
        {PHOTOS.map((photo) => (
          <PhotoFrame
            key={photo.caption}
            className={`aspect-square ${photo.tilt} max-[560px]:aspect-[3/2]
              ${photo.wide ? 'max-[900px]:col-span-2 max-[900px]:aspect-video max-[560px]:col-span-1' : ''}`}
          >
            {photo.caption}
          </PhotoFrame>
        ))}
      </div>
    </section>
  )
}

export default GallerySection
