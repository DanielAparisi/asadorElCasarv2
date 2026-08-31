import { Link } from 'react-router-dom'
import logo from '../../../assets/logo.jpg'

/** Logo plus name. Used in the site header and, slightly smaller, in the footer. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    // A `Link` rather than href="#": the empty anchor went nowhere and only
    // left a dangling `#` in the URL. Today the brand is only painted on `/`,
    // so it barely showed; as soon as the header or footer appear on another
    // route, clicking the logo has to go home.
    <Link to="/" className="flex items-center gap-3.5">
      <img
        src={logo}
        alt="Logo Asador El Casar"
        className={`rounded-full border-2 border-red object-cover
          ${compact ? 'w-[46px] h-[46px]' : 'w-[52px] h-[52px]'}`}
      />
      <span
        className={`font-title uppercase tracking-[0.03em] text-bg
          ${compact ? 'text-[1.3125rem]' : 'text-2xl max-[560px]:text-xl'}`}
      >
        Asador El Casar
      </span>
    </Link>
  )
}
