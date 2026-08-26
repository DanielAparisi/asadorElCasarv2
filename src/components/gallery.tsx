import { Etiqueta, Foto } from './ui'

/**
 * Galería de fotos de la brasa.
 *
 * Las fotos son huecos con trama hasta que haya imágenes reales. Cada una
 * lleva una rotación distinta y pequeña: es lo que evita que la retícula se
 * lea como una tabla y le da el aire de fotos pegadas a mano.
 *
 * Los tres saltos de tamaño están pensados para que la tercera foto nunca
 * quede huérfana: a dos columnas ocupa el ancho completo, a una vuelve a la
 * fila normal.
 */

const FOTOS = [
  { pie: 'foto · parrilla', giro: '-rotate-[1.1deg]', ancha: false },
  { pie: 'foto · pollos', giro: 'rotate-[0.7deg]', ancha: false },
  { pie: 'foto · mesa', giro: '-rotate-[0.5deg]', ancha: true },
]

function Gallery() {
  return (
    <section id="fotos" className="pt-14.5 scroll-mt-6 max-[900px]:pt-11">
      <Etiqueta rojo>La brasa</Etiqueta>

      <div className="grid grid-cols-3 gap-6.5 mt-5 max-[900px]:grid-cols-2 max-[900px]:gap-5 max-[560px]:grid-cols-1">
        {FOTOS.map((foto) => (
          <Foto
            key={foto.pie}
            className={`aspect-square ${foto.giro} max-[560px]:aspect-[3/2]
              ${foto.ancha ? 'max-[900px]:col-span-2 max-[900px]:aspect-video max-[560px]:col-span-1' : ''}`}
          >
            {foto.pie}
          </Foto>
        ))}
      </div>
    </section>
  )
}

export default Gallery
