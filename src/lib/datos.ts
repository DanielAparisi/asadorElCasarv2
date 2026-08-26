/**
 * Datos de contacto y contenido de la carta pública.
 *
 * Están aquí y no en cada componente porque el teléfono y la dirección
 * aparecen en cabecera, pie y ubicación: repetirlos es garantizar que algún
 * día uno se quede sin actualizar.
 *
 * La carta y el horario acabarán saliendo de la base de datos (docs/panel.md,
 * fases 1 y 3). Hasta entonces viven aquí.
 */

export const TELEFONO = '650 71 13 95'
export const TEL_HREF = 'tel:+34650711395'
export const WHATSAPP = 'https://wa.me/34650711395'

export const DIRECCION = 'Calle Alcaldes de la Villa, 23'
export const MAPS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=Calle+Alcaldes+de+la+Villa+23,+19170+El+Casar,+Guadalajara'
export const MAPS_EMBED =
  'https://www.google.com/maps?q=Calle+Alcaldes+de+la+Villa+23,+19170+El+Casar,+Guadalajara&output=embed'

export const INSTAGRAM = 'https://instagram.com/asador_el_casar'
export const FACEBOOK = 'https://facebook.com/asadorelcasar'

/** Enlaces del menú. Los usan la cabecera y el pie. */
export const SECCIONES = [
  { href: '#la-carta', texto: 'La carta' },
  { href: '#fotos', texto: 'Fotos' },
  { href: '#horario', texto: 'Horario' },
  { href: '#reservas', texto: 'Reservas' },
  { href: '#donde-estamos', texto: 'Dónde estamos' },
]

export const CARTA = [
  { nombre: 'Pollo asado entero', precio: '12,00 €' },
  { nombre: 'Medio pollo asado', precio: '6,50 €' },
  { nombre: 'Costillas a la brasa', precio: '14,00 €' },
  { nombre: 'Patatas fritas caseras', precio: '3,50 €' },
  { nombre: 'Croquetas caseras (6 u.)', precio: '6,00 €' },
]

const MEDIODIA = { etiqueta: 'Mediodía', horas: '13:00 – 16:00' }
const NOCHE = { etiqueta: 'Noche', horas: '20:30 – 23:30' }

export const HORARIO = [
  { dia: 'Martes', franjas: [MEDIODIA] },
  { dia: 'Miércoles', franjas: [MEDIODIA] },
  { dia: 'Jueves', franjas: [MEDIODIA] },
  { dia: 'Viernes', franjas: [MEDIODIA, NOCHE] },
  { dia: 'Sábado', franjas: [MEDIODIA, NOCHE] },
  { dia: 'Domingo', franjas: [MEDIODIA] },
]

export const PASOS = [
  {
    num: '01',
    titulo: 'Escríbenos',
    texto: 'Dinos qué quieres y para cuántos. Te confirmamos disponibilidad al momento.',
  },
  {
    num: '02',
    titulo: 'Elige la hora',
    texto: 'Acordamos la hora de recogida para que salga recién hecho de la brasa.',
  },
  {
    num: '03',
    titulo: 'Recoge y listo',
    texto: 'Pasas por el local, pagas y te lo llevas caliente a casa.',
  },
]

/** Reclamos de la banda roja. */
export const RECLAMOS = [
  'Pollo a la brasa',
  'Costillas',
  'Comida para llevar',
  'Recogida en tienda',
  'Lunes cerrado',
  'Menú especial los viernes',
  'Pollo a la brasa',
  'Costillas',
]
