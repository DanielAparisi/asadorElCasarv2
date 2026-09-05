/** The one input style of the panel. See AdminHeading for why it exists. */
export const ADMIN_FIELD_CLASS =
  'border border-gray-300 rounded px-3 py-2 bg-white w-full disabled:opacity-50'

function AdminInput(props: React.ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={`${ADMIN_FIELD_CLASS} ${props.className ?? ''}`}
    />
  )
}

export default AdminInput
