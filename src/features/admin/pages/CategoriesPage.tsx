/**
 * Menu categories: names and ordering. Phase 4 of docs/panel.md.
 *
 * Pending: an editable list with the `sort_order` field. Drag and drop only if
 * they ask for it; an editable number solves 90% of the problem.
 */
function CategoriesPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Categorías</h1>

      <p className="text-gray-500">
        Todavía no hay tabla de categorías: falta crearla en la base de datos.
      </p>
    </div>
  )
}

export default CategoriesPage
