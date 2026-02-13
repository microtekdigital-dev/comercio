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
      .select("*, category:categories(*), supplier:suppliers(*)")
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

    // Apply low stock filter using SQL function (before ordering)
    if (filters?.lowStock) {
      const { data: lowStockIds, error: rpcError } = await supabase
        .rpc('get_products_with_low_stock', { p_company_id: profile.company_id });
      
      if (rpcError) {
        console.error("Error calling get_products_with_low_stock:", rpcError);
        // Fallback to empty result if function fails
        return [];
      }
      
      if (lowStockIds && lowStockIds.length > 0) {
        const productIds = lowStockIds.map((item: any) => item.product_id);
        query = query.in('id', productIds);
      } else {
        // No products with low stock, return empty array
        return [];
      }
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    let products = data || [];

    // For products with variants, calculate total stock
    for (const product of products) {
      if (product.has_variants) {
        const { data: variants } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("product_id", product.id)
          .eq("company_id", profile.company_id)
          .eq("is_active", true);
        
        if (variants && variants.length > 0) {
          product.stock_quantity = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
        }
      }
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
      .select("*, category:categories(*), supplier:suppliers(*)")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) throw error;
    
    // If product has variants, fetch them
    if (data && data.has_variants) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      data.variants = variants || [];
    }
    
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

    // Validate: if has_variants is true, must have at least one variant
    if (formData.has_variants && (!formData.variants || formData.variants.length === 0)) {
      return { error: "Un producto con variantes debe tener al menos una variante configurada" };
    }

    // Extract variants from formData (not a column in products table)
    const { variants, ...productData } = formData;

    // Limpiar campos UUID vacíos (convertir "" a null)
    const cleanedProductData = {
      ...productData,
      category_id: productData.category_id || null,
      supplier_id: productData.supplier_id || null,
    };

    const { data, error } = await supabase
      .from("products")
      .insert({
        ...cleanedProductData,
        company_id: profile.company_id,
        created_by: user.id,
        // If has variants, set stock_quantity to 0
        stock_quantity: formData.has_variants ? 0 : (formData.stock_quantity || 0),
      })
      .select()
      .single();

    if (error) throw error;

    // If product has variants, create them
    if (formData.has_variants && variants && variants.length > 0) {
      const variantsToInsert = variants.map((variant, index) => ({
        company_id: profile.company_id,
        product_id: data.id,
        variant_name: variant.variant_name,
        sku: variant.sku || null,
        stock_quantity: variant.stock_quantity || 0,
        min_stock_level: variant.min_stock_level || 0,
        sort_order: variant.sort_order !== undefined ? variant.sort_order : index,
        is_active: true,
      }));

      const { error: variantsError } = await supabase
        .from("product_variants")
        .insert(variantsToInsert);

      if (variantsError) {
        // Rollback: delete the product if variants creation fails
        await supabase.from("products").delete().eq("id", data.id);
        throw variantsError;
      }
    }

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
      .select("company_id, full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    // Validar longitud del nombre
    if (formData.name.length > 35) {
      return { error: "El nombre del producto no puede exceder 35 caracteres" };
    }

    // Get current product to check if stock changed
    const { data: currentProduct } = await supabase
      .from("products")
      .select("stock_quantity, track_inventory, has_variants")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    // Extract variants from formData (not a column in products table)
    const { variants, ...productData } = formData;

    // Limpiar campos UUID vacíos (convertir "" a null)
    const cleanedFormData = {
      ...productData,
      category_id: productData.category_id || null,
      supplier_id: productData.supplier_id || null,
    };

    const { data, error } = await supabase
      .from("products")
      .update(cleanedFormData)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (error) throw error;

    // Handle variants update if product has variants
    if (formData.has_variants && variants && variants.length > 0) {
      // Import updateProductVariant at the top of the file if not already imported
      const { updateProductVariant } = await import("@/lib/actions/product-variants");
      
      // Get existing variants
      const { data: existingVariants } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", id)
        .eq("company_id", profile.company_id);

      const existingIds = new Set(existingVariants?.map(v => v.id) || []);
      const formVariantIds = new Set(variants.filter(v => v.id).map(v => v.id));

      // Delete variants that are no longer in the form
      const toDelete = Array.from(existingIds).filter(id => !formVariantIds.has(id));
      if (toDelete.length > 0) {
        await supabase
          .from("product_variants")
          .delete()
          .in("id", toDelete);
      }

      // Update or insert variants
      for (const [index, variant] of variants.entries()) {
        if (variant.id && existingIds.has(variant.id)) {
          // Update existing variant using updateProductVariant to register stock changes
          const variantUpdateData = {
            variant_name: variant.variant_name,
            sku: variant.sku || undefined,
            price: variant.price, // Include price if provided
            stock_quantity: variant.stock_quantity || 0,
            min_stock_level: variant.min_stock_level || 0,
            sort_order: variant.sort_order !== undefined ? variant.sort_order : index,
          };

          const result = await updateProductVariant(variant.id, variantUpdateData);
          
          if (result.error) {
            return { error: `Error actualizando variante ${variant.variant_name}: ${result.error}` };
          }
        } else {
          // Insert new variant
          const variantData = {
            company_id: profile.company_id,
            product_id: id,
            variant_name: variant.variant_name,
            sku: variant.sku || null,
            price: variant.price, // Include price if provided
            stock_quantity: variant.stock_quantity || 0,
            min_stock_level: variant.min_stock_level || 0,
            sort_order: variant.sort_order !== undefined ? variant.sort_order : index,
            is_active: true,
          };

          const { data: newVariant, error: insertError } = await supabase
            .from("product_variants")
            .insert(variantData)
            .select()
            .single();

          if (insertError) {
            return { error: `Error insertando variante ${variant.variant_name}: ${insertError.message}` };
          }

          // Register stock movement if initial stock > 0
          if (newVariant && variant.stock_quantity && variant.stock_quantity > 0) {
            const userName = profile.full_name || profile.email;
            
            await supabase
              .from("stock_movements")
              .insert({
                company_id: profile.company_id,
                product_id: id,
                variant_id: newVariant.id,
                movement_type: 'adjustment_in',
                quantity: variant.stock_quantity,
                stock_before: 0,
                stock_after: variant.stock_quantity,
                created_by: user.id,
                created_by_name: userName,
                notes: "Stock inicial de variante agregada",
              });
          }
        }
      }
    }

    // If stock changed and inventory is tracked, register stock movement
    // Only for products WITHOUT variants (variants handle their own stock)
    if (
      currentProduct &&
      !currentProduct.has_variants &&
      currentProduct.track_inventory &&
      formData.stock_quantity !== undefined &&
      formData.stock_quantity !== currentProduct.stock_quantity
    ) {
      const stockBefore = currentProduct.stock_quantity;
      const stockAfter = formData.stock_quantity;
      const quantity = stockAfter - stockBefore;
      const movementType = quantity > 0 ? 'adjustment_in' : 'adjustment_out';
      const userName = profile.full_name || profile.email;

      await supabase
        .from("stock_movements")
        .insert({
          company_id: profile.company_id,
          product_id: id,
          movement_type: movementType,
          quantity: quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          created_by: user.id,
          created_by_name: userName,
          notes: "Ajuste manual de inventario",
        });
    }

    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${id}`);
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

    // Check if product has variants with stock
    const { data: product } = await supabase
      .from("products")
      .select("has_variants")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (product?.has_variants) {
      // Check if any variant has stock
      const { data: variants } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("product_id", id)
        .eq("company_id", profile.company_id);

      if (variants && variants.some(v => v.stock_quantity > 0)) {
        return { error: "No se puede eliminar un producto con stock en sus variantes" };
      }
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
      .select("*, category:categories(*), supplier:suppliers(*)")
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

// Get low stock products (including variants)
export async function getLowStockProducts(): Promise<Array<Product & { variant_id?: string; variant_name?: string }>> {
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
      .select("*, category:categories(*), supplier:suppliers(*)")
      .eq("company_id", profile.company_id)
      .eq("track_inventory", true)
      .eq("is_active", true)
      .order("stock_quantity", { ascending: true });

    if (error) throw error;
    
    const lowStockItems: Array<Product & { variant_id?: string; variant_name?: string }> = [];
    
    for (const product of data || []) {
      if (product.has_variants) {
        // For products with variants, check each variant
        const { data: variants } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", product.id)
          .eq("company_id", profile.company_id)
          .eq("is_active", true);
        
        if (variants) {
          for (const variant of variants) {
            // Only consider low stock if min_stock_level > 0 (product is actually tracked)
            // This excludes variants that the supplier doesn't manufacture (both stock and min are 0)
            if (variant.min_stock_level > 0 && variant.stock_quantity <= variant.min_stock_level) {
              lowStockItems.push({
                ...product,
                variant_id: variant.id,
                variant_name: variant.variant_name,
                stock_quantity: variant.stock_quantity,
                min_stock_level: variant.min_stock_level,
              });
            }
          }
        }
      } else {
        // For simple products, check product stock
        // Only consider low stock if min_stock_level > 0 (product is actually tracked)
        if (product.min_stock_level > 0 && product.stock_quantity <= product.min_stock_level) {
          lowStockItems.push(product);
        }
      }
    }
    
    return lowStockItems;
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }
}

// Get products by IDs (minimal data for checking supplier assignment)
export async function getProductsByIds(productIds: string[]): Promise<Pick<Product, 'id' | 'name' | 'supplier_id'>[]> {
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

    if (!productIds || productIds.length === 0) return [];

    const { data, error } = await supabase
      .from("products")
      .select("id, name, supplier_id")
      .eq("company_id", profile.company_id)
      .in("id", productIds);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching products by IDs:", error);
    return [];
  }
}

// Get products by supplier
export async function getProductsBySupplier(supplierId: string | null): Promise<Product[]> {
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
      .select("*, category:categories(*), supplier:suppliers(*)")
      .eq("company_id", profile.company_id)
      .eq("is_active", true);

    // Si hay proveedor seleccionado, filtrar por ese proveedor
    // Si no hay proveedor, mostrar todos los productos
    if (supplierId) {
      query = query.eq("supplier_id", supplierId);
    }

    query = query.order("name", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching products by supplier:", error);
    return [];
  }
}

// Bulk update supplier for multiple products
export async function bulkUpdateSupplier(productIds: string[], supplierId: string | null) {
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

    if (!productIds || productIds.length === 0) {
      return { error: "Debe seleccionar al menos un producto" };
    }

    // Update all products
    const { error } = await supabase
      .from("products")
      .update({ supplier_id: supplierId || null })
      .in("id", productIds)
      .eq("company_id", profile.company_id);

    if (error) throw error;

    revalidatePath("/dashboard/products");
    return { 
      success: true, 
      message: `${productIds.length} producto(s) actualizado(s) correctamente` 
    };
  } catch (error: any) {
    console.error("Error bulk updating supplier:", error);
    return { error: error.message || "Error al actualizar los productos" };
  }
}
