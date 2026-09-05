import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { Category } from '@/features/menu/types'

export type CategoryInput = {
  name: string
  sort_order: number
}

const COLUMNS = 'id, name, sort_order'

/**
 * The categories, for the panel: the dropdown of the dish form and the
 * ordering screen.
 *
 * Sibling of useDishes and built the same way. Categories have no `available`
 * column, so there is nothing to hide here: what the panel lists is what the
 * public menu groups by.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select(COLUMNS)
        .order('sort_order')
        .abortSignal(controller.signal)

      if (controller.signal.aborted) return

      if (error) setError(error.message)
      else setCategories(data as Category[])

      setLoading(false)
    }

    fetchCategories()
    return () => controller.abort()
  }, [])

  async function createCategory(category: CategoryInput) {
    setSaving(true)
    setSaveError(null)

    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select(COLUMNS)
      .single()
    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return null
    }

    const created = data as Category
    setCategories((previous) => [...previous, created])
    return created
  }

  async function updateCategory(id: number, changes: Partial<CategoryInput>) {
    setSaving(true)
    setSaveError(null)

    const { data, error } = await supabase
      .from('categories')
      .update(changes)
      .eq('id', id)
      .select(COLUMNS)
      .single()
    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return null
    }

    const updated = data as Category
    setCategories((previous) =>
      previous.map((category) => (category.id === id ? updated : category)),
    )
    return updated
  }

  /**
   * Deleting a category that still has dishes fails: the foreign key is
   * `on delete restrict`, deliberately, so nothing is ever orphaned. What
   * Postgres says about it ("violates foreign key constraint
   * dishes_category_id_fkey") means nothing to the owners of a restaurant, so
   * it is translated here.
   */
  async function deleteCategory(id: number) {
    setSaving(true)
    setSaveError(null)

    const { error } = await supabase.from('categories').delete().eq('id', id)
    setSaving(false)

    if (error) {
      // 23503 is foreign_key_violation, and on this table it can only ever
      // mean one thing.
      setSaveError(
        error.code === '23503'
          ? 'Esa categoría todavía tiene platos dentro. Muévelos a otra categoría o bórralos antes.'
          : error.message,
      )
      return false
    }

    setCategories((previous) => previous.filter((category) => category.id !== id))
    return true
  }

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    saving,
    saveError,
  }
}
