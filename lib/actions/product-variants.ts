"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { 
  ProductVariant, 
  ProductVariantFormData, 
  VariantType,
  Product
} from "@/lib/types/erp";
import { VARIANT_TYPES, VARIANT_ERRORS } from "@/lib/types/erp";

// =====================================================
// Get Product Variants
// =====================================================

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
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
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}

// =====================================================
// Create Variants for Product
// =====================================================

export async function createVariantsForProduct(
  productId: string,
  variantType: VariantType,
  customVariants?: ProductVariantFormData[]
): Promise<{ data?: ProductVariant[], error?: string }> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "Perfil de usuario no encontrado" };
    }

    // Validate variant type
    if (!['shirts', 'pants', 'custom'].includes(variantType)) {
      return { error: VARIANT_ERRORS.INVALID_VARIANT_TYPE };
    }

    // Prepare variants to insert
    let variantsToInsert: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>[] = [];

    if (variantType === 'shirts' || variantType === 'pants') {
      // Create predefined variants
      const sizes = VARIANT_TYPES[variantType].sizes;
      variantsToInsert = sizes.map((size, index) => ({
        company_id: profile.company_id,
        product_id: productId,
        variant_name: size,
        sku: null,
        price: null,
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index,
        is_active: true
      }));
    } else if (variantType === 'custom' && customVariants) {
      // Create custom variants
      variantsToInsert = customVariants.map((variant, index) => ({
        company_id: profile.company_id,
        product_id: productId,
        variant_name: variant.variant_name,
        sku: variant.sku || null,
        price: variant.price || null,
        stock_quantity: variant.stock_quantity || 0,
        min_stock_level: variant.min_stock_level || 0,
        sort_order: variant.sort_order !== undefined ? variant.sort_order : index,
        is_active: true
      }));
    } else {
      return { error: VARIANT_ERRORS.NO_VARIANTS };
    }

    // Check for duplicate variant names
    const variantNames = variantsToInsert.map(v => v.variant_name.toLowerCase());
    const uniqueNames = new Set(variantNames);
    if (variantNames.length !== uniqueNames.size) {
      return { error: VARIANT_ERRORS.DUPLICATE_VARIANT };
    }

    // Insert variants
    const { data, error } = await supabase
      .from("product_variants")
      .insert(variantsToInsert)
      .select();

    if (error) {
      console.error("Error creating variants:", error);
      return { error: error.message };
    }

    // Register stock movements for variants with initial stock > 0
    if (data && data.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const userName = profileData?.full_name || profileData?.email || "Usuario";

      const stockMovements = data
        .filter(variant => variant.stock_quantity > 0)
        .map(variant => ({
          company_id: profile.company_id,
          product_id: productId,
          variant_id: variant.id,
          movement_type: 'adjustment_in' as const,
          quantity: variant.stock_quantity,
          stock_before: 0,
          stock_after: variant.stock_quantity,
          created_by: user.id,
          created_by_name: userName,
          notes: "Stock inicial de variante",
        }));

      if (stockMovements.length > 0) {
        await supabase
          .from("stock_movements")
          .insert(stockMovements);
      }
    }

    revalidatePath("/dashboard/products");
    return { data: data || [] };
  } catch (error) {
    console.error("Error in createVariantsForProduct:", error);
    return { error: "Error al crear variantes" };
  }
}

// =====================================================
// Update Product Variant
// =====================================================

export async function updateProductVariant(
  variantId: string,
  data: Partial<ProductVariantFormData>
): Promise<{ data?: ProductVariant, error?: string }> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "Perfil de usuario no encontrado" };
    }

    // Validate stock is not negative
    if (data.stock_quantity !== undefined && data.stock_quantity < 0) {
      return { error: VARIANT_ERRORS.NEGATIVE_STOCK };
    }

    // Check if variant exists and belongs to user's company
    const { data: existingVariant } = await supabase
      .from("product_variants")
      .select("*")
      .eq("id", variantId)
      .eq("company_id", profile.company_id)
      .single();

    if (!existingVariant) {
      return { error: VARIANT_ERRORS.VARIANT_NOT_FOUND };
    }

    // If changing variant name, check for duplicates
    if (data.variant_name && data.variant_name !== existingVariant.variant_name) {
      const { data: duplicate } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", existingVariant.product_id)
        .eq("company_id", profile.company_id)
        .ilike("variant_name", data.variant_name)
        .neq("id", variantId)
        .single();

      if (duplicate) {
        return { error: VARIANT_ERRORS.DUPLICATE_VARIANT };
      }
    }

    // Update variant
    const updateData: any = {};
    if (data.variant_name !== undefined) updateData.variant_name = data.variant_name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
    if (data.min_stock_level !== undefined) updateData.min_stock_level = data.min_stock_level;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    const { data: updated, error } = await supabase
      .from("product_variants")
      .update(updateData)
      .eq("id", variantId)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating variant:", error);
      return { error: error.message };
    }

    // If stock changed, register stock movement
    if (
      data.stock_quantity !== undefined &&
      data.stock_quantity !== existingVariant.stock_quantity
    ) {
      const stockBefore = existingVariant.stock_quantity;
      const stockAfter = data.stock_quantity;
      const quantity = stockAfter - stockBefore;
      const movementType = quantity > 0 ? 'adjustment_in' : 'adjustment_out';
      const userName = profile.full_name || profile.email;

      await supabase
        .from("stock_movements")
        .insert({
          company_id: profile.company_id,
          product_id: existingVariant.product_id,
          variant_id: variantId,
          movement_type: movementType,
          quantity: quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          created_by: user.id,
          created_by_name: userName,
          notes: "Ajuste manual de inventario (variante)",
        });
    }

    revalidatePath("/dashboard/products");
    return { data: updated };
  } catch (error) {
    console.error("Error in updateProductVariant:", error);
    return { error: "Error al actualizar variante" };
  }
}

// =====================================================
// Delete Product Variant
// =====================================================

export async function deleteProductVariant(
  variantId: string
): Promise<{ success?: boolean, error?: string }> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "Perfil de usuario no encontrado" };
    }

    // Check if variant exists and has stock
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .eq("company_id", profile.company_id)
      .single();

    if (!variant) {
      return { error: VARIANT_ERRORS.VARIANT_NOT_FOUND };
    }

    if (variant.stock_quantity > 0) {
      return { error: VARIANT_ERRORS.CANNOT_DELETE_WITH_STOCK };
    }

    // Delete variant
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId)
      .eq("company_id", profile.company_id);

    if (error) {
      console.error("Error deleting variant:", error);
      return { error: error.message };
    }

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteProductVariant:", error);
    return { error: "Error al eliminar variante" };
  }
}

// =====================================================
// Get Product Total Stock
// =====================================================

export async function getProductTotalStock(productId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return 0;

    // Get product to check if it has variants
    const { data: product } = await supabase
      .from("products")
      .select("has_variants, stock_quantity")
      .eq("id", productId)
      .eq("company_id", profile.company_id)
      .single();

    if (!product) return 0;

    // If product doesn't have variants, return simple stock
    if (!product.has_variants) {
      return product.stock_quantity || 0;
    }

    // If product has variants, sum variant stocks
    const { data: variants } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("product_id", productId)
      .eq("company_id", profile.company_id)
      .eq("is_active", true);

    if (!variants || variants.length === 0) return 0;

    return variants.reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0);
  } catch (error) {
    console.error("Error calculating total stock:", error);
    return 0;
  }
}

// =====================================================
// Validate Variant Stock
// =====================================================

export async function validateVariantStock(
  variantId: string,
  quantity: number
): Promise<{ available: boolean, currentStock: number }> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { available: false, currentStock: 0 };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { available: false, currentStock: 0 };
    }

    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .eq("company_id", profile.company_id)
      .single();

    if (!variant) {
      return { available: false, currentStock: 0 };
    }

    return {
      available: variant.stock_quantity >= quantity,
      currentStock: variant.stock_quantity
    };
  } catch (error) {
    console.error("Error validating variant stock:", error);
    return { available: false, currentStock: 0 };
  }
}

// =====================================================
// Convert Simple Product to Variant Product
// =====================================================

export async function convertToVariantProduct(
  productId: string,
  variantType: VariantType,
  stockDistribution: 'default' | 'distribute',
  customVariants?: ProductVariantFormData[]
): Promise<{ data?: Product, error?: string }> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "Perfil de usuario no encontrado" };
    }

    // Get current product
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("company_id", profile.company_id)
      .single();

    if (!product) {
      return { error: VARIANT_ERRORS.PRODUCT_NOT_FOUND };
    }

    if (product.has_variants) {
      return { error: "El producto ya tiene variantes activadas" };
    }

    const currentStock = product.stock_quantity || 0;

    // Create variants first
    const variantsResult = await createVariantsForProduct(productId, variantType, customVariants);
    
    if (variantsResult.error || !variantsResult.data) {
      return { error: variantsResult.error || "Error al crear variantes" };
    }

    const createdVariants = variantsResult.data;

    // Distribute stock
    if (currentStock > 0 && createdVariants.length > 0) {
      if (stockDistribution === 'default') {
        // Put all stock in first variant
        await supabase
          .from("product_variants")
          .update({ stock_quantity: currentStock })
          .eq("id", createdVariants[0].id);
      } else if (stockDistribution === 'distribute') {
        // Distribute evenly
        const stockPerVariant = Math.floor(currentStock / createdVariants.length);
        const remainder = currentStock % createdVariants.length;

        for (let i = 0; i < createdVariants.length; i++) {
          const stock = stockPerVariant + (i < remainder ? 1 : 0);
          await supabase
            .from("product_variants")
            .update({ stock_quantity: stock })
            .eq("id", createdVariants[i].id);
        }
      }
    }

    // Update product to enable variants
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        has_variants: true,
        variant_type: variantType,
        stock_quantity: 0 // Reset simple stock
      })
      .eq("id", productId)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating product:", updateError);
      return { error: updateError.message };
    }

    revalidatePath("/dashboard/products");
    return { data: updatedProduct };
  } catch (error) {
    console.error("Error in convertToVariantProduct:", error);
    return { error: "Error al convertir producto" };
  }
}

// =====================================================
// Disable Product Variants
// =====================================================

export async function disableProductVariants(
  productId: string
): Promise<{ success?: boolean, error?: string }> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "Perfil de usuario no encontrado" };
    }

    // Check if any variant has stock
    const { data: variants } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("product_id", productId)
      .eq("company_id", profile.company_id);

    if (variants && variants.some(v => v.stock_quantity > 0)) {
      return { error: VARIANT_ERRORS.CANNOT_DISABLE_WITH_STOCK };
    }

    // Delete all variants
    await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId)
      .eq("company_id", profile.company_id);

    // Update product
    const { error: updateError } = await supabase
      .from("products")
      .update({
        has_variants: false,
        variant_type: null
      })
      .eq("id", productId)
      .eq("company_id", profile.company_id);

    if (updateError) {
      console.error("Error updating product:", updateError);
      return { error: updateError.message };
    }

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    console.error("Error in disableProductVariants:", error);
    return { error: "Error al desactivar variantes" };
  }
}
