"use server";

import { createProduct, updateProduct } from "@/lib/actions/products";
import type { ProductFormData } from "@/lib/types/erp";
import type { ImportResult } from "@/lib/utils/csv-parser";

interface ImportRow {
  rowNumber: number;
  productData: ProductFormData;
  existingProductId?: string;
  existingSku?: string;
}

/**
 * Ejecuta el upsert masivo de productos.
 * Procesa cada fila individualmente para aislar errores.
 */
export async function importProductsFromCsv(
  rows: ImportRow[]
): Promise<ImportResult> {
  const result: ImportResult = {
    totalProcessed: rows.length,
    created: 0,
    updated: 0,
    errors: [],
  };

  for (const row of rows) {
    try {
      if (row.existingProductId) {
        const res = await updateProduct(row.existingProductId, row.productData);
        if (res.error) {
          result.errors.push({
            rowNumber: row.rowNumber,
            sku: row.existingSku,
            error: res.error,
          });
        } else {
          result.updated++;
        }
      } else {
        const res = await createProduct(row.productData);
        if (res.error) {
          result.errors.push({
            rowNumber: row.rowNumber,
            sku: row.existingSku,
            error: res.error,
          });
        } else {
          result.created++;
        }
      }
    } catch (err: any) {
      result.errors.push({
        rowNumber: row.rowNumber,
        sku: row.existingSku,
        error: err?.message || "Error desconocido",
      });
    }
  }

  return result;
}
