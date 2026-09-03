import {
  ADDRESS,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  LATITUDE,
  LOCALITY,
  LONGITUDE,
  MAPS_DIRECTIONS_URL,
  PHONE_HREF,
  POSTAL_CODE,
  REGION,
  REGION_CODE,
  WEEKLY_SCHEDULE,
// The `.ts` is not a slip: this module is also compiled by tsconfig.node.json
// —vite.config.ts imports it to write the tags into index.html— and Node's
// module resolution demands the extension. It is the only file in the project
// on both sides of that line.
} from './content.ts'

/**
 * What search engines and WhatsApp read: the page description, the link
 * preview and the Google business card.
 *
 * None of it is rendered by React. `vite.config.ts` imports this module and
 * writes the tags into index.html, because a preview crawler reads the HTML it
 * downloads and never runs the JavaScript: a description injected by React
 * would be invisible to exactly the readers it is written for.
 *
 * It builds on `content.ts` on purpose. The address and the opening hours were
 * going to be typed a second time here, and a restaurant whose real hours and
 * whose hours in Google disagree is worse off than one that never published
 * them.
 */

export const SITE_NAME = 'Asador El Casar'

/** The tab, and the blue line of the Google result. The town is in it on
 *  purpose: half the searches that matter say "El Casar" out loud. */
export const SITE_TITLE = 'Asador El Casar · Pollo a la brasa en El Casar'

/**
 * The coordinates, only when both are filled in (see content.ts). Local search
 * is the one place where a plausible-looking wrong value is worse than an
 * absent one: it puts the pin on another street.
 */
export const COORDINATES = LATITUDE && LONGITUDE ? { latitude: LATITUDE, longitude: LONGITUDE } : null

/**
 * The `geo.*` meta tags. They are the old, pre-schema.org way of saying where
 * a business is, and they cost four lines: Bing still reads them and some
 * directories scrape them.
 */
export const GEO_META = [
  { name: 'geo.region', content: REGION_CODE },
  { name: 'geo.placename', content: LOCALITY },
  ...(COORDINATES
    ? [
        { name: 'geo.position', content: `${COORDINATES.latitude};${COORDINATES.longitude}` },
        { name: 'ICBM', content: `${COORDINATES.latitude}, ${COORDINATES.longitude}` },
      ]
    : []),
]

/** ~155 characters: what Google shows before cutting it off. */
export const SITE_DESCRIPTION =
  'Asador en El Casar (Guadalajara): pollo a la brasa, costillas y comida casera para llevar o recoger. Pide por teléfono o WhatsApp. Lunes cerrado.'

/**
 * The link preview image, served from `public/` so its URL is stable.
 *
 * It is a copy of `src/assets/logo.jpg` and not an import: everything under
 * `src/assets` gets a content hash in its file name at build time, and a URL
 * that changes with every deploy is a URL that the crawlers' caches keep
 * getting wrong.
 */
export const OG_IMAGE_PATH = '/og.jpg'

/** Spanish day names → the codes schema.org expects. */
const DAY_OF_WEEK: Record<string, string> = {
  Lunes: 'Monday',
  Martes: 'Tuesday',
  Miércoles: 'Wednesday',
  Jueves: 'Thursday',
  Viernes: 'Friday',
  Sábado: 'Saturday',
  Domingo: 'Sunday',
}

/**
 * The structured data of the business, as JSON-LD.
 *
 * This is what feeds the Google card with the address, the phone number and
 * the opening hours. `siteUrl` is empty until the site has a domain (see
 * VITE_SITE_URL in .env.example): the fields that need an absolute URL are
 * left out rather than filled with a guess, because a wrong `url` is worse
 * than a missing one.
 */
export function buildRestaurantJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    ...(siteUrl && { url: siteUrl, image: `${siteUrl}${OG_IMAGE_PATH}` }),
    // The `tel:` href already carries the international prefix, which is the
    // form schema.org asks for.
    telephone: PHONE_HREF.replace('tel:', ''),
    address: {
      '@type': 'PostalAddress',
      streetAddress: ADDRESS,
      addressLocality: LOCALITY,
      postalCode: POSTAL_CODE,
      addressRegion: REGION,
      addressCountry: 'ES',
    },
    servesCuisine: 'Asador',
    priceRange: '€',
    // What the neighbourhood searches look like: "pollo asado El Casar".
    areaServed: { '@type': 'Place', name: `${LOCALITY}, ${REGION}` },
    hasMap: MAPS_DIRECTIONS_URL,
    ...(COORDINATES && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: COORDINATES.latitude,
        longitude: COORDINATES.longitude,
      },
    }),
    // The menu is a section of the same page, so it only exists as a URL once
    // there is a domain to hang it from.
    ...(siteUrl && { hasMenu: `${siteUrl}/#la-carta` }),
    acceptsReservations: true,
    sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
    // One entry per service, not per day: Friday has lunch and dinner, and the
    // days the grill is off simply do not appear — which is how "Lunes
    // cerrado" is said in this vocabulary.
    openingHoursSpecification: WEEKLY_SCHEDULE.flatMap(({ day, slots }) =>
      slots.map((slot) => {
        const [opens, closes] = slot.hours.split('–').map((hour) => hour.trim())

        return {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: DAY_OF_WEEK[day],
          opens,
          closes,
        }
      }),
    ),
  }
}
