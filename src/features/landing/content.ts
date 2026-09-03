/**
 * Contact details and copy for the public landing page.
 *
 * They live here and not inside each component because the phone number and
 * the address appear in the header, the footer and the location section:
 * repeating them guarantees that one day one of them goes stale.
 *
 * The menu is not here: it lives in features/menu. The opening hours will
 * eventually come from the database the same way (docs/panel.md).
 *
 * Values are user-facing copy and stay in Spanish; only the identifiers are
 * English.
 */

export const PHONE_NUMBER = '650 71 13 95'
export const PHONE_HREF = 'tel:+34650711395'
export const WHATSAPP_URL = 'https://wa.me/34650711395'

export const ADDRESS = 'Calle Alcaldes de la Villa, 23'
export const ADDRESS_EXTRA = '1.º piso, local 10'
export const LOCALITY = 'El Casar'
export const POSTAL_CODE = '19170'
export const REGION = 'Guadalajara'
/** ISO 3166-2 code of the province, for the `geo.region` meta tag. */
export const REGION_CODE = 'ES-GU'

/**
 * Coordinates of the door, for local search.
 *
 * Empty on purpose: they have to be the real ones. In Google Maps, right click
 * on the spot → the first line of the menu is the pair, copy it here as
 * `40.703123` / `-3.428456`. While they are empty the geo tags and the `geo`
 * block of the business card are left out, which is the right thing — a
 * restaurant pinned 400 m away is worse than one with no pin at all.
 */
export const LATITUDE = ''
export const LONGITUDE = ''
export const MAPS_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=Calle+Alcaldes+de+la+Villa+23,+19170+El+Casar,+Guadalajara'
export const MAPS_EMBED_URL =
  'https://www.google.com/maps?q=Calle+Alcaldes+de+la+Villa+23,+19170+El+Casar,+Guadalajara&output=embed'

export const INSTAGRAM_URL = 'https://instagram.com/asador_el_casar'
export const FACEBOOK_URL = 'https://facebook.com/asadorelcasar'

/** In-page navigation links. Shared by the header and the footer. */
export const NAV_LINKS = [
  { href: '#la-carta', label: 'La carta' },
  { href: '#horario', label: 'Horario' },
  { href: '#reservas', label: 'Reservas' },
  { href: '#donde-estamos', label: 'Dónde estamos' },
]

export type TimeSlot = { label: string; hours: string }

const LUNCH: TimeSlot = { label: 'Mediodía', hours: '13:00 – 16:00' }
const DINNER: TimeSlot = { label: 'Noche', hours: '20:30 – 23:30' }

export const WEEKLY_SCHEDULE: { day: string; slots: TimeSlot[] }[] = [
  { day: 'Martes', slots: [LUNCH] },
  { day: 'Miércoles', slots: [LUNCH] },
  { day: 'Jueves', slots: [LUNCH] },
  { day: 'Viernes', slots: [LUNCH, DINNER] },
  { day: 'Sábado', slots: [LUNCH, DINNER] },
  { day: 'Domingo', slots: [LUNCH] },
]

/** How ordering works, shown as a numbered list in the order section. */
export const ORDER_STEPS = [
  {
    number: '01',
    title: 'Escríbenos',
    text: 'Dinos qué quieres y para cuántos. Te confirmamos disponibilidad al momento.',
  },
  {
    number: '02',
    title: 'Elige la hora',
    text: 'Acordamos la hora de recogida para que salga recién hecho de la brasa.',
  },
  {
    number: '03',
    title: 'Recoge y listo',
    text: 'Pasas por el local, pagas y te lo llevas caliente a casa.',
  },
]

/** Selling points scrolling in the red band. */
export const MARQUEE_TAGLINES = [
  'Pollo a la brasa',
  'Costillas',
  'Comida para llevar',
  'Recogida en tienda',
  'Lunes cerrado',
  'Menú especial los viernes',
  'Pollo a la brasa',
  'Costillas',
]
