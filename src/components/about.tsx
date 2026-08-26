import { BLOQUE, Entradilla, Etiqueta, Titular } from './ui'

/**
 * "Sobre nosotros": la columna derecha del bloque que comparte con la carta.
 *
 * No trae el `grid` ni el ancho: eso lo pone quien la coloca, que es lo que
 * permite reordenar la página sin tocar la sección.
 */
function About() {
  return (
    <div id="nosotros">
      <Etiqueta>La casa</Etiqueta>
      <Titular className="mt-5 mb-6 text-[3.75rem] leading-[0.94] max-[900px]:text-[2.75rem] max-[560px]:text-[2.375rem]">
        Sobre nosotros
      </Titular>

      <Entradilla>
        Un asador familiar de barrio donde la parrilla no se apaga. Recetas caseras y productos de
        primera calidad, con el trato de toda la vida. Reservas, recogida en tienda y comida para
        llevar.
      </Entradilla>

      {/* Bloque ámbar de refuerzo, torcido como un cartel pegado a mano */}
      <div className={`flex flex-col gap-1.5 mt-7 px-6 py-5.5 bg-amber ${BLOQUE} -rotate-[0.8deg]`}>
        <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-ink">
          La parrilla no se apaga
        </span>
        <span className="font-title text-[2.5rem] leading-none uppercase text-ink max-[560px]:text-[1.75rem]">
          De martes a domingo
        </span>
      </div>
    </div>
  )
}

export default About
