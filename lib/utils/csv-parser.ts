import type { Category, ProductFormData } from "@/lib/types/erp";

// =====================================================
// Types
// =====================================================

export interface CsvRow {
  rowNumber: number;
  rawData: Record<string, string>;
}

export type ImportRowStatus = "valid_create" | "valid_update" | "error";

export interface ParsedImportRow {
  rowNumber: number;
  status: ImportRowStatus;
  errors: string[];
  productData?: ProductFormData;
  existingProductId?: string; // ID del producto existente si status === 'valid_update'
  existingSku?: string;
}

export interface CsvParseResult {
  rows: ParsedImportRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
}

export interface ImportResult {
  totalProcessed: number;
  created: number;
  updated: number;
  errors: Array<{ rowNumber: number; sku?: string; error: string }>;
}

// =====================================================
// Constants
// =====================================================

export const CSV_COLUMNS = [
  "nombre",
  "descripcion",
  "precio",
  "precio_costo",
  "stock",
  "sku",
  "categoria",
  "unidad",
  "activo",
] as const;

export const CSV_MAX_ROWS = 500;
export const CSV_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// =====================================================
// Parseo
// =====================================================

/**
 * Parsea texto CSV usando la primera fila como encabezados.
 * Retorna array de CsvRow con rowNumber (1-based, sin contar encabezado).
 */
export function parseCsvText(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const rawData: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rawData[header] = values[idx] ?? "";
    });
    rows.push({ rowNumber: i, rawData });
  }

  return rows;
}

/** Parsea una línea CSV respetando comillas dobles */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// =====================================================
// Validación
// =====================================================

const VALID_ACTIVO_VALUES = new Set([
  "true",
  "false",
  "1",
  "0",
  "si",
  "sí",
  "no",
]);

/**
 * Valida una fila cruda y la convierte a ParsedImportRow.
 */
export function validateRow(
  row: CsvRow,
  categories: Category[],
  existingSkuMap: Map<string, string> // sku → product.id
): ParsedImportRow {
  const errors: string[] = [];
  const d = row.rawData;

  // nombre
  const nombre = (d["nombre"] ?? "").trim();
  if (!nombre) errors.push("El nombre es requerido");

  // precio
  const precioRaw = (d["precio"] ?? "").trim();
  const precio = parseFloat(precioRaw);
  if (!precioRaw || isNaN(precio) || precio <= 0) {
    errors.push("El precio debe ser un número mayor a 0");
  }

  // stock
  const stockRaw = (d["stock"] ?? "").trim();
  const stock = stockRaw === "" ? 0 : parseInt(stockRaw, 10);
  if (stockRaw !== "" && (isNaN(stock) || stock < 0 || String(parseInt(stockRaw, 10)) !== stockRaw.replace(/\.0+$/, ""))) {
    errors.push("El stock debe ser un número entero mayor o igual a 0");
  }

  // precio_costo
  const costRaw = (d["precio_costo"] ?? "").trim();
  let cost: number | undefined;
  if (costRaw !== "") {
    cost = parseFloat(costRaw);
    if (isNaN(cost) || cost < 0) {
      errors.push("El precio de costo debe ser un número mayor o igual a 0");
    }
  }

  // categoria
  let categoryId: string | undefined;
  const categoriaRaw = (d["categoria"] ?? "").trim();
  if (categoriaRaw !== "") {
    const found = categories.find(
      (c) => c.name.toLowerCase().trim() === categoriaRaw.toLowerCase()
    );
    if (!found) {
      errors.push(`La categoría '${categoriaRaw}' no existe en el sistema`);
    } else {
      categoryId = found.id;
    }
  }

  // activo
  const activoRaw = (d["activo"] ?? "").trim().toLowerCase();
  let isActive = true;
  if (activoRaw !== "") {
    if (!VALID_ACTIVO_VALUES.has(activoRaw)) {
      errors.push("El campo activo debe ser: true, false, 1, 0, si, no");
    } else {
      isActive = activoRaw === "true" || activoRaw === "1" || activoRaw === "si" || activoRaw === "sí";
    }
  }

  if (errors.length > 0) {
    return { rowNumber: row.rowNumber, status: "error", errors };
  }

  const sku = (d["sku"] ?? "").trim() || undefined;
  const existingProductId = sku ? existingSkuMap.get(sku) : undefined;
  const status: ImportRowStatus = existingProductId ? "valid_update" : "valid_create";

  const productData: ProductFormData = {
    name: nombre,
    description: (d["descripcion"] ?? "").trim() || undefined,
    price: precio,
    cost: cost ?? 0,
    stock_quantity: stockRaw === "" ? 0 : stock,
    sku,
    category_id: categoryId,
    is_active: isActive,
    type: "product",
    currency: "ARS",
    tax_rate: 0,
    track_inventory: true,
    has_variants: false,
    min_stock_level: 0,
  };

  return {
    rowNumber: row.rowNumber,
    status,
    errors: [],
    productData,
    existingProductId,
    existingSku: sku,
  };
}

/**
 * Procesa todas las filas y retorna el resultado completo del parseo.
 */
export function parseAndValidateCsv(
  text: string,
  categories: Category[],
  existingSkuMap: Map<string, string>
): CsvParseResult {
  const rawRows = parseCsvText(text);
  const rows = rawRows.map((row) => validateRow(row, categories, existingSkuMap));
  const validRows = rows.filter((r) => r.status !== "error").length;
  const errorRows = rows.filter((r) => r.status === "error").length;

  return {
    rows,
    totalRows: rows.length,
    validRows,
    errorRows,
  };
}

// =====================================================
// Validación de archivo
// =====================================================

export function validateCsvFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { valid: false, error: "Solo se aceptan archivos CSV (.csv)" };
  }
  if (file.size > CSV_MAX_SIZE_BYTES) {
    return { valid: false, error: "El archivo no puede superar 5 MB" };
  }
  return { valid: true };
}

// =====================================================
// Generación de plantilla
// =====================================================

export function generateTemplateCsv(): string {
  const headers = CSV_COLUMNS.join(",");
  const example1 = [
    "Remera Básica",
    "Remera de algodón 100%",
    "2500",
    "1200",
    "50",
    "REM-001",
    "Ropa",
    "unidad",
    "true",
  ]
    .map(quoteIfNeeded)
    .join(",");
  const example2 = [
    "Pantalón Jean",
    "Jean clásico azul",
    "8500",
    "4000",
    "30",
    "PAN-001",
    "Ropa",
    "unidad",
    "true",
  ]
    .map(quoteIfNeeded)
    .join(",");

  return [headers, example1, example2].join("\n");
}

function quoteIfNeeded(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
