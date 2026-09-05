import { FACEBOOK_URL, INSTAGRAM_URL, PHONE_HREF } from '../content'
import FacebookIcon from '@/shared/components/icons/FacebookIcon'
import InstagramIcon from '@/shared/components/icons/InstagramIcon'
import PhoneIcon from '@/shared/components/icons/PhoneIcon'

const SOCIAL_LINKS = [
  { href: INSTAGRAM_URL, label: 'Instagram', Icon: InstagramIcon, external: true },
  { href: FACEBOOK_URL, label: 'Facebook', Icon: FacebookIcon, external: true },
  // The phone is not a social network, but it shares the same round button.
  { href: PHONE_HREF, label: 'Llamar por teléfono', Icon: PhoneIcon, external: false },
]

export function SocialLinks() {
  return (
    <div className="flex gap-3">
      {SOCIAL_LINKS.map(({ href, label, Icon, external }) => (
        <a
          key={label}
          href={href}
          // The link carries the accessible name because the icon is decorative.
          aria-label={label}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-flex items-center justify-center w-[46px] h-[46px] rounded-full
            border-2 border-line-dark text-bg transition-colors hover:bg-red hover:border-red"
        >
          <Icon />
        </a>
      ))}
    </div>
  )
}
