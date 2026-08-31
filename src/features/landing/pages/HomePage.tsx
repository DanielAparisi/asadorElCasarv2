import SiteHeader from '../components/SiteHeader'
import HeroSection from '../components/HeroSection'
import MarqueeBand from '../components/MarqueeBand'
import MenuSection from '../components/MenuSection'
import AboutSection from '../components/AboutSection'
import GallerySection from '../components/GallerySection'
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
 */
function HomePage() {
  return (
    <>
      <SiteHeader />
      <HeroSection />
      <MarqueeBand />

      <div className={PAGE_CONTAINER}>
        {/* The menu and the about column share one two-column block. */}
        <section className="grid grid-cols-[1.15fr_1fr] gap-14 pt-16 max-[900px]:grid-cols-1 max-[900px]:gap-11 max-[900px]:pt-12">
          <MenuSection />
          <AboutSection />
        </section>

        <GallerySection />
        <ScheduleSection />
        <OrderSection />
        <LocationSection />
      </div>

      <SiteFooter />
    </>
  )
}

export default HomePage
