"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { VariantTemplate } from "@/lib/types/erp";

/**
 * Get all variant templates for the current company
 */
export async function getVariantTemplates(): Promise<VariantTemplate[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get user's company_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return [];
  }

  const { data, error } = await supabase
    .from("variant_templates")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("template_name");

  if (error) {
    console.error("Error fetching variant templates:", error);
    return [];
  }

  return data || [];
}

/**
 * Create a new variant template
 */
export async function createVariantTemplate(
  templateName: string,
  sizes: string[]
): Promise<{ data?: VariantTemplate; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // Get user's company_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return { error: "No se encontró la compañía del usuario" };
  }

  // Validate input
  if (!templateName.trim()) {
    return { error: "El nombre de la plantilla es requerido" };
  }

  if (!sizes || sizes.length === 0) {
    return { error: "La plantilla debe tener al menos una talla" };
  }

  // Check for duplicate template name
  const { data: existing } = await supabase
    .from("variant_templates")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("template_name", templateName.trim())
    .single();

  if (existing) {
    return { error: "Ya existe una plantilla con ese nombre" };
  }

  // Create template
  const { data, error } = await supabase
    .from("variant_templates")
    .insert({
      company_id: profile.company_id,
      template_name: templateName.trim(),
      sizes: sizes.filter(s => s.trim()),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating variant template:", error);
    return { error: "Error al crear la plantilla" };
  }

  revalidatePath("/dashboard/products");
  return { data };
}

/**
 * Update an existing variant template
 */
export async function updateVariantTemplate(
  templateId: string,
  templateName: string,
  sizes: string[]
): Promise<{ data?: VariantTemplate; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // Validate input
  if (!templateName.trim()) {
    return { error: "El nombre de la plantilla es requerido" };
  }

  if (!sizes || sizes.length === 0) {
    return { error: "La plantilla debe tener al menos una talla" };
  }

  // Get user's company_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return { error: "No se encontró la compañía del usuario" };
  }

  // Check for duplicate template name (excluding current template)
  const { data: existing } = await supabase
    .from("variant_templates")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("template_name", templateName.trim())
    .neq("id", templateId)
    .single();

  if (existing) {
    return { error: "Ya existe una plantilla con ese nombre" };
  }

  // Update template
  const { data, error } = await supabase
    .from("variant_templates")
    .update({
      template_name: templateName.trim(),
      sizes: sizes.filter(s => s.trim()),
    })
    .eq("id", templateId)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating variant template:", error);
    return { error: "Error al actualizar la plantilla" };
  }

  revalidatePath("/dashboard/products");
  return { data };
}

/**
 * Delete a variant template
 */
export async function deleteVariantTemplate(
  templateId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // Get user's company_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return { error: "No se encontró la compañía del usuario" };
  }

  // Check if template is in use
  const { inUse, productCount } = await isTemplateInUse(templateId);
  if (inUse) {
    return {
      error: `No se puede eliminar una plantilla que está siendo utilizada por ${productCount} producto(s)`,
    };
  }

  // Delete template
  const { error } = await supabase
    .from("variant_templates")
    .delete()
    .eq("id", templateId)
    .eq("company_id", profile.company_id);

  if (error) {
    console.error("Error deleting variant template:", error);
    return { error: "Error al eliminar la plantilla" };
  }

  revalidatePath("/dashboard/products");
  return { success: true };
}

/**
 * Check if a template is being used by any products
 */
export async function isTemplateInUse(
  templateId: string
): Promise<{ inUse: boolean; productCount: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { inUse: false, productCount: 0 };
  }

  // Get user's company_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return { inUse: false, productCount: 0 };
  }

  // Count products using this template
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("company_id", profile.company_id)
    .eq("variant_template_id", templateId);

  if (error) {
    console.error("Error checking template usage:", error);
    return { inUse: false, productCount: 0 };
  }

  return {
    inUse: (count || 0) > 0,
    productCount: count || 0,
  };
}
