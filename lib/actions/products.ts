"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Product, ProductFormData } from "@/lib/types/erp";
import { requirePermission } from "@/lib/utils/permissions";
import { canAddProduct } from "@/lib/utils/plan-limits";

// Get all products for a company with filters
export async function getProducts(filters?: {
  search?: string;
  categoryId?: string;
  type?: string;
  lowStock?: boolean;
  isActive?: boolean;
}): Promise<Product[]> {
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

    let query = supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("company_id", profile.company_id);

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }

    if (filters?.type) {
      query = query.eq("type", filters.type);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    let products = data || [];

    // Filter low stock in memory (can't do complex comparison in Supabase query easily)
    if (filters?.lowStock) {
      products = products.filter(p => p.track_inventory && p.stock_quantity <= p.min_stock_level);
    }

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Get single product
export async function getProduct(id: string): Promise<Product | null> {
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
      .from("products")
      .select("*, category:categories(*)")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Create product
export async function createProduct(formData: ProductFormData) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canCreateProducts");

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

    // Validar longitud del nombre
    if (formData.name.length > 35) {
      return { error: "El nombre del producto no puede exceder 35 caracteres" };
    }

    // Verificar límite de productos del plan
    const productLimit = await canAddProduct(profile.company_id);
    if (!productLimit.allowed) {
      return { 
        error: productLimit.message || "Has alcanzado el límite de productos de tu plan" 
      };
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        ...formData,
        company_id: profile.company_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/products");
    return { data };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { error: error.message || "Error al crear el producto" };
  }
}

// Update product
export async function updateProduct(id: string, formData: ProductFormData) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canEditProducts");

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

    // Validar longitud del nombre
    if (formData.name.length > 35) {
      return { error: "El nombre del producto no puede exceder 35 caracteres" };
    }

    const { data, error } = await supabase
      .from("products")
      .update(formData)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/products");
    return { data };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { error: error.message || "Error al actualizar el producto" };
  }
}

// Delete product
export async function deleteProduct(id: string) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canDeleteProducts");

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
      .from("products")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) throw error;

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return { error: error.message || "Error al eliminar el producto" };
  }
}

// Search products
export async function searchProducts(query: string): Promise<Product[]> {
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
      .from("products")
      .select("*, category:categories(*)")
      .eq("company_id", profile.company_id)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

// Get low stock products
export async function getLowStockProducts(): Promise<Product[]> {
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
      .from("products")
      .select("*, category:categories(*)")
      .eq("company_id", profile.company_id)
      .eq("track_inventory", true)
      .filter("stock_quantity", "lte", "min_stock_level")
      .order("stock_quantity", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }
}
