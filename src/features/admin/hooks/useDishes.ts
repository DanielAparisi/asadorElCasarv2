import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/lib/supabase'
import type { Dish } from '../../menu/types'

/** The columns the panel writes. The database fills in the rest. */
export type DishInput = {
  name: string
  description: string
  price_cents: number
  category_id: number
  sort_order: number
  available: boolean
}

const COLUMNS = 'id, name, description, price_cents, category_id, sort_order, available'

/**
 * The dishes, for the panel.
 *
 * Same shape as useAdmins on purpose — useEffect + useState, `loading`,
 * `error`, an AbortController in the cleanup and a separate pair of states for
 * the mutation in flight. Five hooks with this structure is fine; the generic
 * useSupabaseQuery they are asking to become is a worse trade (docs/panel.md
 * §4).
 *
 * The difference with useMenu is that here `available` does NOT filter: the
 * panel has to see the dishes that are off the menu, or the switch that took
 * them off would be a one way trip. Admins see every row because their write
 * policy is `for all`, and policies are OR'ed.
 *
 * Writes update the local state with the row the database returns instead of
 * refetching the list — the same thing useAdmins.addAdmin does.
 */
export function useDishes() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchDishes() {
      const { data, error } = await supabase
        .from('dishes')
        .select(COLUMNS)
        .order('category_id')
        .order('sort_order')
        .abortSignal(controller.signal)

      if (controller.signal.aborted) return

      if (error) setError(error.message)
      else setDishes(data as Dish[])

      setLoading(false)
    }

    fetchDishes()
    return () => controller.abort()
  }, [])

  async function createDish(dish: DishInput) {
    setSaving(true)
    setSaveError(null)

    const { data, error } = await supabase.from('dishes').insert(dish).select(COLUMNS).single()
    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return null
    }

    const created = data as Dish
    setDishes((previous) => [...previous, created])
    return created
  }

  async function updateDish(id: number, changes: Partial<DishInput>) {
    setSaving(true)
    setSaveError(null)

    const { data, error } = await supabase
      .from('dishes')
      .update(changes)
      .eq('id', id)
      .select(COLUMNS)
      .single()
    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return null
    }

    const updated = data as Dish
    setDishes((previous) => previous.map((dish) => (dish.id === id ? updated : dish)))
    return updated
  }

  /**
   * The button they will press every day: on the menu / off the menu, one
   * click, without opening the dish.
   */
  async function toggleAvailable(id: number) {
    const dish = dishes.find((candidate) => candidate.id === id)
    if (!dish) return null

    return updateDish(id, { available: !dish.available })
  }

  /**
   * Deleting for real. It exists for typos, not for daily use: the panel keeps
   * it behind a confirmation on the edit screen, never in the list.
   */
  async function deleteDish(id: number) {
    setSaving(true)
    setSaveError(null)

    const { error } = await supabase.from('dishes').delete().eq('id', id)
    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return false
    }

    setDishes((previous) => previous.filter((dish) => dish.id !== id))
    return true
  }

  return {
    dishes,
    loading,
    error,
    createDish,
    updateDish,
    toggleAvailable,
    deleteDish,
    saving,
    saveError,
  }
}
