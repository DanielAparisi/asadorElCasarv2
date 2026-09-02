/**
 * The page title of the panel. It was copied into five files before this
 * existed.
 *
 * The panel is allowed to be ugly (docs/panel.md, principle 2) — which is
 * exactly why its looks live in one place: the day someone decides it should
 * stop being ugly, it is three files and not twelve.
 */
function AdminHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="text-xl font-semibold">{children}</h1>
}

export default AdminHeading
