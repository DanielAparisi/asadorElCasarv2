/** Small mono label that introduces a section. */
export function Tag({
  red = false,
  children,
}: {
  red?: boolean
  children: React.ReactNode
}) {
  return (
    <p
      className={`inline-block px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] leading-snug
        ${red ? 'bg-red text-white' : 'bg-ink text-bg'}`}
    >
      {children}
    </p>
  )
}
