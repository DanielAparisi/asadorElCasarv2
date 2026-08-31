/**
 * The shared pieces of the restaurant's visual language: flat blocks, thick
 * borders and hard shadows.
 *
 * In the original stylesheet these were classes (.btn, .tag, .photo…). As
 * Tailwind utilities those strings are long and repeat across five files, so
 * they live here instead: one place to change them.
 */

/** Border and shadow of the "poster" look, the base of most of the design. */
export const POSTER_BORDER = 'border-[3px] border-ink'
export const POSTER_SHADOW = 'shadow-[7px_7px_0_var(--color-ink)]'

/** Content width. Full-bleed bands opt out of this. */
export const PAGE_CONTAINER = 'max-w-[1120px] mx-auto px-6'
