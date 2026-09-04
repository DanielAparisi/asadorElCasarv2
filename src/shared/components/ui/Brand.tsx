import logo from '../../../assets/logo.jpg'

/** Logo plus name. Used in the site header and, slightly smaller, in the footer. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    // A real anchor rather than a router `Link`, and rather than the href="#"
    // this used to be: the empty anchor went nowhere and left a dangling `#`
    // in the URL. It cannot be a `Link` because the header and the footer are
    // painted on `/`, which App renders outside the router so that the landing
    // does not download it — see app/App.tsx. The full reload an anchor causes
    // costs nothing here: the only place the brand appears is the page it
    // points at.
    <a href="/" className="flex items-center gap-3.5">
      <img
        src={logo}
        alt="Logo Asador El Casar"
        // The size is in the classes too, but the attributes are what the
        // browser has before the CSS arrives: without them the header grows
        // when the image lands and everything below it jumps.
        width={compact ? 46 : 52}
        height={compact ? 46 : 52}
        className={`rounded-full border-2 border-red object-cover
          ${compact ? 'w-[46px] h-[46px]' : 'w-[52px] h-[52px]'}`}
      />
      <span
        className={`font-title uppercase tracking-[0.03em] text-bg
          ${compact ? 'text-[1.3125rem]' : 'text-2xl max-[560px]:text-xl'}`}
      >
        Asador El Casar
      </span>
    </a>
  )
}
