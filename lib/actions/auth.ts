"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export type RecoveryEmailCheck = {
  success: boolean
  error?: string
}

export async function verifyRecoveryEmail(email: string): Promise<RecoveryEmailCheck> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    return { success: false, error: "Email is required" }
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return { success: false, error: "Admin client not configured" }
  }

  const { data, error } = await adminClient
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle()

  if (error) {
    return { success: false, error: "Failed to verify email" }
  }

  if (!data) {
    return { success: false, error: "No account found with that email" }
  }

  return { success: true }
}
