import SiteHeader from '../components/SiteHeader'
import HeroSection from '../components/HeroSection'
import MarqueeBand from '../components/MarqueeBand'
import MenuSection from '../components/MenuSection'
import AboutSection from '../components/AboutSection'
import ScheduleSection from '../components/ScheduleSection'
import OrderSection from '../components/OrderSection'
import LocationSection from '../components/LocationSection'
import SiteFooter from '../components/SiteFooter'
import { PAGE_CONTAINER } from '../../../shared/components/ui/tokens'

/**
 * The public landing page.
 *
 * It only composes and lays out sections: every piece of copy and markup lives
 * in its own component. Reordering the page means moving a line here.
 *
 * The header, the marquee band and the footer are full-bleed, so they sit
 * outside the page container.
 *
 * Everything between the header and the footer is wrapped in a `main`. It
 * paints nothing — it is there so a screen reader has a landmark to jump to.
 * Without it the only way past the header and the repeated navigation is to
 * walk the whole page; with it, one keystroke lands on the content. It also
 * marks where the page stops being furniture, which is what the `header` and
 * `footer` elements already say for their own ends.
 */
function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        <HeroSection />
        <MarqueeBand />

        <div className={PAGE_CONTAINER}>
          {/* "About us" no longer shares a row with the menu: since every dish
              carries a photo, the menu takes the full width. Its copy keeps a
              reading width of its own — a paragraph 1120 px wide is a paragraph
              nobody finishes. */}
          <section className="pt-16 max-w-[46rem] max-[900px]:pt-12">
            <AboutSection />
          </section>

          <MenuSection />

          <ScheduleSection />
          <OrderSection />
          <LocationSection />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}

export default HomePage
