import { NAV_LINKS, PHONE_HREF, PHONE_NUMBER } from '../content'
import { Brand } from '@/shared/components/ui/Brand'
import { PAGE_CONTAINER } from '@/shared/components/ui/tokens'
import PhoneIcon from '@/shared/components/icons/PhoneIcon'

/**
 * Header: a full-bleed ink band with the brand, the menu and the phone number
 * always in sight.
 *
 * Below 900px the navigation drops to a centred third row (`order-3` +
 * `w-full`) instead of squeezing against the logo.
 */
function SiteHeader() {
  return (
    <header className="bg-ink">
      <div
        className={`${PAGE_CONTAINER} flex items-center justify-between gap-8 flex-wrap py-3.5
          max-[900px]:justify-center max-[900px]:text-center max-[900px]:gap-4`}
      >
        <Brand />

        <nav
          className="flex items-center gap-6.5 flex-wrap font-mono text-[0.8125rem] font-bold
            uppercase tracking-[0.12em]
            max-[900px]:order-3 max-[900px]:w-full max-[900px]:justify-center max-[900px]:gap-4.5"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-bg pb-[3px] border-b-2 border-transparent transition-colors
                hover:text-white hover:border-red"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={PHONE_HREF}
          className="inline-flex items-center gap-2.5 px-4.5 py-2.75 rounded-[2px]
            bg-red text-white transition-colors hover:bg-red-dark"
        >
          <PhoneIcon />
          <span className="font-title text-[1.1875rem] tracking-[0.05em]">{PHONE_NUMBER}</span>
        </a>
      </div>
    </header>
  )
}

export default SiteHeader
