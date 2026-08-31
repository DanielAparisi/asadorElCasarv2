import { ADDRESS, NAV_LINKS, PHONE_NUMBER, WHATSAPP_URL } from '../content'
import { SocialLinks } from './SocialLinks'
import { BUTTON_ON_INK, Button } from '../../../shared/components/ui/Button'
import { Brand } from '../../../shared/components/ui/Brand'
import { PAGE_CONTAINER } from '../../../shared/components/ui/tokens'
import WhatsAppIcon from '../../../shared/components/icons/WhatsAppIcon'

/**
 * Footer: brand, repeated menu, contact and small print.
 *
 * Repeating the navigation here is deliberate: someone who reaches the bottom
 * of the page should not have to scroll back up to keep browsing.
 */
function SiteFooter() {
  return (
    <footer className="bg-ink border-t-[3px] border-red">
      <div className={`${PAGE_CONTAINER} pt-12 pb-6.5`}>
        <div
          className="grid grid-cols-[1.2fr_1fr_auto] gap-12 items-start pb-8.5
            max-[900px]:grid-cols-1 max-[900px]:gap-8"
        >
          <div>
            <Brand compact />
            <p className="mt-4 max-w-[22rem] text-[0.9375rem] leading-[1.6] text-on-dark-mute">
              Pollo a la brasa y comida para llevar en El Casar.
            </p>
          </div>

          {/* On narrow screens the menu becomes a horizontally scrolling row
              instead of stretching the footer vertically. */}
          <nav
            className="grid gap-2.5 justify-items-start font-mono text-[0.8125rem] font-bold
              uppercase tracking-[0.12em]
              max-[900px]:grid-flow-col max-[900px]:auto-cols-max max-[900px]:gap-5
              max-[900px]:overflow-x-auto"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-bg pb-0.5 border-b-2 border-transparent transition-colors hover:border-red"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col items-end gap-4.5 max-[900px]:items-start">
            <Button
              variant="red"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`gap-2.75 px-5.5 py-3.5 text-base tracking-[0.03em] ${BUTTON_ON_INK}`}
            >
              <WhatsAppIcon />
              WhatsApp · {PHONE_NUMBER}
            </Button>

            <SocialLinks />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap pt-5.5 border-t-2 border-line-dark">
          <p className="m-0 font-mono text-xs tracking-[0.05em] text-ink-mute">
            © 2026 Asador El Casar · Comida para llevar
          </p>
          <p className="m-0 font-mono text-xs tracking-[0.05em] text-ink-mute">
            {ADDRESS} · El Casar, 19170
          </p>
        </div>

        <div className="flex justify-center pt-4.5">
          <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white">
            Desarrollado por Daniel Aparisi
          </span>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
