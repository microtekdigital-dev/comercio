"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Category, CategoryFormData } from "@/lib/types/erp";
import { requirePermission } from "@/lib/utils/permissions";

// Get all categories for a company
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Get single category
export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return null;

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

// Create category
export async function createCategory(formData: CategoryFormData) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canCreateCategories");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        ...formData,
        company_id: profile.company_id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return { data };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return { error: error.message || "Error al crear la categoría" };
  }
}

// Update category
export async function updateCategory(id: string, formData: CategoryFormData) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canEditCategories");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    const { data, error } = await supabase
      .from("categories")
      .update(formData)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return { data };
  } catch (error: any) {
    console.error("Error updating category:", error);
    return { error: error.message || "Error al actualizar la categoría" };
  }
}

// Delete category
export async function deleteCategory(id: string) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canDeleteCategories");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) throw error;

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return { error: error.message || "Error al eliminar la categoría" };
  }
}
