"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import crypto from "crypto"
import { canAddUser } from "@/lib/utils/plan-limits"
import { canAddUser } from "@/lib/utils/plan-limits"

export type InvitationResult = {
  success: boolean
  error?: string
  data?: {
    id: string
    email: string
    token: string
  }
}

export async function sendInvitation(
  email: string,
  role: "admin" | "employee"
): Promise<InvitationResult> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user's profile and company
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" }
  }

  if (profile.role !== "admin") {
    return { success: false, error: "Only admins can send invitations" }
  }

  // Verificar límite de usuarios del plan
  const userLimit = await canAddUser(profile.company_id)
  if (!userLimit.allowed) {
    return { 
      success: false, 
      error: userLimit.message || "Has alcanzado el límite de usuarios de tu plan" 
    }
  }

  // Check if email is already invited
  const { data: existingInvitation } = await supabase
    .from("invitations")
    .select("id")
    .eq("email", email)
    .eq("company_id", profile.company_id)
    .eq("status", "pending")
    .single()

  if (existingInvitation) {
    return { success: false, error: "This email has already been invited" }
  }

  // Check if user already exists in company
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .eq("company_id", profile.company_id)
    .single()

  if (existingUser) {
    return { success: false, error: "This user is already part of your company" }
  }

  // Generate invitation token
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  // Create invitation
  const { data: invitation, error: inviteError } = await supabase
    .from("invitations")
    .insert({
      company_id: profile.company_id,
      email,
      role,
      token,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, email, token")
    .single()

  if (inviteError) {
    return { success: false, error: "Failed to create invitation" }
  }

  // In a production app, you would send an email here using a service like Resend or SendGrid
  // For now, we'll return the invitation details
  
  revalidateTag("invitations", "max")

  return {
    success: true,
    data: invitation,
  }
}

export async function getInvitations() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") return []

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  return invitations || []
}

export async function revokeInvitation(invitationId: string): Promise<InvitationResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Only admins can revoke invitations" }
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "expired" })
    .eq("id", invitationId)
    .eq("company_id", profile.company_id)

  if (error) {
    return { success: false, error: "Failed to revoke invitation" }
  }

  revalidateTag("invitations", "max")

  return { success: true }
}

export async function getInvitationByToken(token: string) {
  const supabase = await createClient()

  const { data: invitation } = await supabase
    .from("invitations")
    .select(`
      *,
      companies:company_id (
        name
      )
    `)
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single()

  return invitation
}
