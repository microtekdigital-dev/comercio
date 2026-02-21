'use server'

import { createClient } from '@/lib/supabase/server'
import type { RepairNote } from '@/lib/types/erp'

/**
 * Get all notes for a repair order
 * @param repairOrderId - Repair order ID
 * @returns Array of repair notes ordered by date
 */
export async function getRepairNotes(repairOrderId: string): Promise<RepairNote[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('repair_notes')
    .select('*')
    .eq('repair_order_id', repairOrderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching repair notes:', error)
    throw new Error('Error al obtener notas de la reparación')
  }

  return data || []
}

/**
 * Create a repair note
 * @param repairOrderId - Repair order ID
 * @param note - Note text
 * @returns Created repair note
 */
export async function createRepairNote(
  repairOrderId: string,
  note: string
): Promise<RepairNote> {
  const supabase = await createClient()

  if (!note || !note.trim()) {
    throw new Error('La nota no puede estar vacía')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  const { data, error } = await supabase
    .from('repair_notes')
    .insert({
      repair_order_id: repairOrderId,
      note: note.trim(),
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating repair note:', error)
    throw new Error('Error al crear nota de reparación')
  }

  return data
}

/**
 * Update a repair note (only by creator)
 * @param id - Note ID
 * @param note - Updated note text
 * @returns Updated repair note
 */
export async function updateRepairNote(
  id: string,
  note: string
): Promise<RepairNote> {
  const supabase = await createClient()

  if (!note || !note.trim()) {
    throw new Error('La nota no puede estar vacía')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Check if user is the creator
  const { data: existingNote, error: fetchError } = await supabase
    .from('repair_notes')
    .select('created_by')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching repair note:', fetchError)
    throw new Error('Nota no encontrada')
  }

  if (existingNote.created_by !== user.id) {
    throw new Error('Solo puedes editar tus propias notas')
  }

  const { data, error } = await supabase
    .from('repair_notes')
    .update({
      note: note.trim(),
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating repair note:', error)
    throw new Error('Error al actualizar nota')
  }

  return data
}

/**
 * Delete a repair note (only by creator)
 * @param id - Note ID
 */
export async function deleteRepairNote(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Check if user is the creator
  const { data: existingNote, error: fetchError } = await supabase
    .from('repair_notes')
    .select('created_by')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching repair note:', fetchError)
    throw new Error('Nota no encontrada')
  }

  if (existingNote.created_by !== user.id) {
    throw new Error('Solo puedes eliminar tus propias notas')
  }

  const { error } = await supabase
    .from('repair_notes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting repair note:', error)
    throw new Error('Error al eliminar nota')
  }
}
