/**
 * Lienzo común de todos los iconos.
 *
 * Fija la caja (24×24), el tamaño en pantalla y `aria-hidden`: los iconos de
 * esta web siempre acompañan a un texto o van dentro de un enlace con
 * `aria-label`, así que nunca deben anunciarse por su cuenta.
 *
 * Los trazos usan `currentColor` para heredar el color de quien los contiene:
 * por eso el mismo icono sirve en la cabecera (blanco sobre rojo) y en el pie
 * (papel sobre tinta) sin variantes.
 */
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg aria-hidden="true" className="w-5 h-5 flex-none block" viewBox="0 0 24 24">{children}</svg>
  )
}

export default Svg
