"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidateTag } from "next/cache"

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      companies:company_id (
        id,
        name,
        slug
      )
    `)
    .eq("id", user.id)
    .single()

  return profile
}

export async function getTeamMembers() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile?.company_id) return []

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: true })

  return members || []
}

export async function updateProfile(fullName: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      full_name: fullName,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id)

  if (error) {
    return { success: false, error: "Failed to update profile" }
  }

  revalidateTag("profile", "max")

  return { success: true }
}

export async function updateMemberRole(memberId: string, role: "admin" | "employee") {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if current user is admin
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Only admins can change roles" }
  }

  // Can't change own role (to prevent lockout)
  if (memberId === user.id) {
    return { success: false, error: "You cannot change your own role" }
  }

  // Update member role
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", memberId)
    .eq("company_id", currentProfile.company_id)

  if (error) {
    return { success: false, error: "Failed to update role" }
  }

  revalidateTag("team", "max")

  return { success: true }
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if current user is admin
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Only admins can remove members" }
  }

  // Can't remove yourself
  if (memberId === user.id) {
    return { success: false, error: "You cannot remove yourself" }
  }

  const { data: member } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", memberId)
    .eq("company_id", currentProfile.company_id)
    .single()

  if (!member) {
    return { success: false, error: "Member not found" }
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return { success: false, error: "Admin client not configured" }
  }

  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(memberId)
  if (deleteAuthError) {
    return { success: false, error: "Failed to deactivate user" }
  }

  const { error: deleteProfileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", memberId)

  if (deleteProfileError) {
    return { success: false, error: "Failed to delete member profile" }
  }

  revalidateTag("team", "max")

  return { success: true }
}

export async function updateCompany(name: string) {
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
    return { success: false, error: "Only admins can update company" }
  }

  const { error } = await supabase
    .from("companies")
    .update({ 
      name,
      updated_at: new Date().toISOString()
    })
    .eq("id", profile.company_id)

  if (error) {
    return { success: false, error: "Failed to update company" }
  }

  revalidateTag("company", "max")

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
