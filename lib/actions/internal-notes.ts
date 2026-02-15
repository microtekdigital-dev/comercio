"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CreateInternalNoteInput, UpdateInternalNoteInput, InternalNote } from "@/lib/types/erp"

/**
 * Obtiene todas las notas internas de la empresa del usuario actual
 * Incluye información del autor (nombre y email) mediante JOIN con profiles
 * Las notas se ordenan por fecha de creación descendente (más recientes primero)
 */
export async function getInternalNotes(): Promise<InternalNote[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("internal_notes")
    .select(`
      *,
      profiles!user_id (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map(note => ({
    ...note,
    user_name: note.profiles?.full_name || "Usuario",
    user_email: note.profiles?.email
  })) as InternalNote[]
}

/**
 * Crea una nueva nota interna
 * Captura automáticamente: user_id, company_id, y timestamp
 * Valida que el contenido no esté vacío después de trim
 */
export async function createInternalNote(input: CreateInternalNoteInput): Promise<InternalNote> {
  const supabase = await createClient()
  
  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Obtener company_id del usuario
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .single()

  if (!companyUser) throw new Error("Usuario sin empresa")

  // Validar contenido no vacío
  const trimmedContent = input.content.trim()
  if (trimmedContent.length === 0) {
    throw new Error("El contenido de la nota no puede estar vacío")
  }

  // Crear nota
  const { data, error } = await supabase
    .from("internal_notes")
    .insert({
      company_id: companyUser.company_id,
      user_id: user.id,
      content: trimmedContent,
      note_type: input.note_type
    })
    .select(`
      *,
      profiles!user_id (
        full_name,
        email
      )
    `)
    .single()

  if (error) throw error

  revalidatePath("/dashboard")
  
  return {
    ...data,
    user_name: data.profiles?.full_name || "Usuario",
    user_email: data.profiles?.email
  } as InternalNote
}

/**
 * Actualiza una nota interna (principalmente para marcar como resuelta)
 * Solo el autor o un admin pueden actualizar la nota (verificado por RLS)
 */
export async function updateInternalNote(input: UpdateInternalNoteInput): Promise<InternalNote> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("internal_notes")
    .update({ is_resolved: input.is_resolved })
    .eq("id", input.id)
    .select(`
      *,
      profiles!user_id (
        full_name,
        email
      )
    `)
    .single()

  if (error) throw error

  revalidatePath("/dashboard")
  
  return {
    ...data,
    user_name: data.profiles?.full_name || "Usuario",
    user_email: data.profiles?.email
  } as InternalNote
}

/**
 * Elimina una nota interna permanentemente
 * Solo el autor o un admin pueden eliminar la nota (verificado por RLS)
 */
export async function deleteInternalNote(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("internal_notes")
    .delete()
    .eq("id", id)

  if (error) throw error

  revalidatePath("/dashboard")
}

/**
 * Obtiene el contador de notas activas (no resueltas) de la empresa
 * Usado para mostrar el badge en el botón flotante
 */
export async function getActiveNotesCount(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from("internal_notes")
    .select("*", { count: "exact", head: true })
    .eq("is_resolved", false)

  if (error) throw error
  return count || 0
}
