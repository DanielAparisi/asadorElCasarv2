/**
 * A label with its field underneath. DishForm has six of them; without this it
 * would be born past the 120 lines that docs/cleanCode.md §4 sets as the limit
 * for a component.
 */
function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

export default AdminField
