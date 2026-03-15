"use server"

import { createClient } from "@/lib/supabase/server"

// Módulos del ERP
export type AuditModule =
  | "ventas"
  | "devoluciones"
  | "stock"
  | "compras"
  | "pagos"
  | "reparaciones"
  | "caja"
  | "productos"
  | "presupuestos"
  | "clientes"
  | "proveedores"

// Acciones posibles
export type AuditAction =
  | "crear"
  | "modificar"
  | "cancelar"
  | "eliminar"
  | "recibir"
  | "abrir"
  | "cerrar"
  | "movimiento"
  | "cambio_precio"
  | "pagar"
  | "procesar"

export interface AuditEventInput {
  module: AuditModule
  action: AuditAction
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}

export interface AuditLogFilters {
  module?: AuditModule
  action?: AuditAction
  userId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface AuditLogEntry {
  id: string
  company_id: string
  user_id: string
  user_name?: string
  module: AuditModule
  action: AuditAction
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

/**
 * Registra un evento de auditoría. Fire-and-forget: nunca lanza excepciones.
 */
export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.company_id) return

    await supabase.from("audit_logs").insert({
      company_id: profile.company_id,
      user_id: user.id,
      module: input.module,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: input.metadata ?? null,
    })
  } catch (err) {
    console.error("[audit-log] Error al registrar evento:", err)
  }
}

/**
 * Consulta el log de auditoría. Solo accesible para usuarios con rol admin.
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("No autenticado")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) throw new Error("Perfil no encontrado")
  if (profile.role !== "admin") throw new Error("Acceso denegado: se requiere rol admin")

  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("audit_logs")
    .select(`
      id,
      company_id,
      user_id,
      module,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (filters.module) query = query.eq("module", filters.module)
  if (filters.action) query = query.eq("action", filters.action)
  if (filters.userId) query = query.eq("user_id", filters.userId)
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom)
  if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`)

  const { data, error } = await query

  if (error) {
    console.error("[audit-log] Error al consultar logs:", JSON.stringify(error), error)
    return []
  }

  const rows = data ?? []

  // Obtener nombres de usuario en una query separada
  const userIds = [...new Set(rows.map((r: any) => r.user_id))]
  let userNames: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)
    if (profiles) {
      userNames = Object.fromEntries(profiles.map((p: any) => [p.id, p.full_name]))
    }
  }

  return rows.map((row: any) => ({
    id: row.id,
    company_id: row.company_id,
    user_id: row.user_id,
    user_name: userNames[row.user_id] ?? undefined,
    module: row.module as AuditModule,
    action: row.action as AuditAction,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: row.metadata,
    created_at: row.created_at,
  }))
}
