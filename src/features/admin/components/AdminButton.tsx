import { ADMIN_FIELD_CLASS } from './AdminInput'

/**
 * The panel button. `variant="quiet"` is the secondary one — cancel, and the
 * on menu / off menu switch of the list.
 */
function AdminButton({
  variant = 'primary',
  ...props
}: React.ComponentProps<'button'> & { variant?: 'primary' | 'quiet' }) {
  const style =
    variant === 'primary'
      ? 'bg-gray-800 text-white rounded px-4 py-2 text-sm disabled:opacity-50'
      : `${ADMIN_FIELD_CLASS} w-auto text-sm hover:bg-gray-50`

  return <button {...props} className={`${style} ${props.className ?? ''}`} />
}

export default AdminButton
