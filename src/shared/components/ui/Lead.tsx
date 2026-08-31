/** Intro paragraph. Use `inverted` when it sits on an ink background. */
export function Lead({
  inverted = false,
  children,
}: {
  inverted?: boolean
  children: React.ReactNode
}) {
  return (
    <p
      className={`m-0 max-w-[30rem] leading-[1.7] text-pretty max-[900px]:max-w-none
        ${inverted ? 'text-on-dark' : 'text-ink-soft'}`}
    >
      {children}
    </p>
  )
}
