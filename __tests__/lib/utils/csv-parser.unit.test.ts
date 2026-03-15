import { describe, it, expect } from "vitest";
import {
  parseCsvText,
  validateRow,
  parseAndValidateCsv,
  generateTemplateCsv,
  validateCsvFile,
  CSV_COLUMNS,
  CSV_MAX_ROWS,
  CSV_MAX_SIZE_BYTES,
} from "@/lib/utils/csv-parser";
import type { Category } from "@/lib/types/erp";

const mockCategories: Category[] = [
  {
    id: "cat-1",
    company_id: "co-1",
    name: "Ropa",
    description: null,
    parent_id: null,
    color: null,
    icon: null,
    sort_order: 0,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "cat-2",
    company_id: "co-1",
    name: "Electrónica",
    description: null,
    parent_id: null,
    color: null,
    icon: null,
    sort_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

const emptySkuMap = new Map<string, string>();

// =====================================================
// parseCsvText
// =====================================================
describe("parseCsvText", () => {
  it("retorna array vacío si solo hay encabezado", () => {
    const csv = "nombre,precio,stock";
    expect(parseCsvText(csv)).toHaveLength(0);
  });

  it("retorna array vacío si el texto está vacío", () => {
    expect(parseCsvText("")).toHaveLength(0);
  });

  it("parsea 3 filas correctamente", () => {
    const csv = "nombre,precio,stock\nProd A,100,5\nProd B,200,10\nProd C,300,0";
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(3);
    expect(rows[0].rowNumber).toBe(1);
    expect(rows[0].rawData["nombre"]).toBe("Prod A");
    expect(rows[2].rawData["nombre"]).toBe("Prod C");
  });

  it("maneja valores entre comillas con comas", () => {
    const csv = `nombre,descripcion,precio\n"Prod, A","Desc, con coma",100`;
    const rows = parseCsvText(csv);
    expect(rows[0].rawData["nombre"]).toBe("Prod, A");
    expect(rows[0].rawData["descripcion"]).toBe("Desc, con coma");
  });

  it("ignora líneas vacías al final", () => {
    const csv = "nombre,precio\nProd A,100\n\n";
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(1);
  });
});

// =====================================================
// validateRow
// =====================================================
describe("validateRow", () => {
  const makeRow = (data: Record<string, string>, rowNumber = 1) => ({
    rowNumber,
    rawData: data,
  });

  it("fila válida retorna status valid_create", () => {
    const row = makeRow({ nombre: "Remera", precio: "1000", stock: "5" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("valid_create");
    expect(result.errors).toHaveLength(0);
  });

  it("nombre vacío retorna error", () => {
    const row = makeRow({ nombre: "", precio: "1000", stock: "5" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("error");
    expect(result.errors.some((e) => e.includes("nombre"))).toBe(true);
  });

  it("precio negativo retorna error", () => {
    const row = makeRow({ nombre: "Prod", precio: "-10", stock: "5" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("error");
    expect(result.errors.some((e) => e.includes("precio"))).toBe(true);
  });

  it("precio cero retorna error", () => {
    const row = makeRow({ nombre: "Prod", precio: "0", stock: "5" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("error");
  });

  it("stock negativo retorna error", () => {
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "-1" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("error");
    expect(result.errors.some((e) => e.includes("stock"))).toBe(true);
  });

  it("stock decimal retorna error", () => {
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "5.5" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("error");
  });

  it("stock vacío usa 0 por defecto", () => {
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("valid_create");
    expect(result.productData?.stock_quantity).toBe(0);
  });

  it("categoria existente resuelve category_id", () => {
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "5", categoria: "Ropa" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("valid_create");
    expect(result.productData?.category_id).toBe("cat-1");
  });

  it("categoria inexistente retorna error", () => {
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "5", categoria: "NoExiste" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("error");
    expect(result.errors.some((e) => e.includes("NoExiste"))).toBe(true);
  });

  it("activo inválido retorna error", () => {
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "5", activo: "maybe" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.status).toBe("error");
  });

  it("activo=false → is_active false", () => {
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "5", activo: "false" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.productData?.is_active).toBe(false);
  });

  it("activo=no → is_active false", () => {
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "5", activo: "no" });
    const result = validateRow(row, mockCategories, emptySkuMap);
    expect(result.productData?.is_active).toBe(false);
  });

  it("SKU existente retorna valid_update con existingProductId", () => {
    const skuMap = new Map([["SKU-001", "prod-uuid-1"]]);
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "5", sku: "SKU-001" });
    const result = validateRow(row, mockCategories, skuMap);
    expect(result.status).toBe("valid_update");
    expect(result.existingProductId).toBe("prod-uuid-1");
  });

  it("sin SKU siempre retorna valid_create", () => {
    const skuMap = new Map([["SKU-001", "prod-uuid-1"]]);
    const row = makeRow({ nombre: "Prod", precio: "100", stock: "5", sku: "" });
    const result = validateRow(row, mockCategories, skuMap);
    expect(result.status).toBe("valid_create");
  });
});

// =====================================================
// generateTemplateCsv
// =====================================================
describe("generateTemplateCsv", () => {
  it("contiene todas las columnas requeridas en el encabezado", () => {
    const csv = generateTemplateCsv();
    const firstLine = csv.split("\n")[0].toLowerCase();
    for (const col of CSV_COLUMNS) {
      expect(firstLine).toContain(col);
    }
  });

  it("tiene al menos 2 filas de datos", () => {
    const csv = generateTemplateCsv();
    const lines = csv.split("\n").filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(3); // 1 header + 2 data
  });

  it("las filas de ejemplo son válidas al parsear", () => {
    const csv = generateTemplateCsv();
    const result = parseAndValidateCsv(csv, mockCategories, emptySkuMap);
    // Las filas de ejemplo usan categoría "Ropa" que existe en mockCategories
    // Al menos no deben tener errores de formato numérico
    result.rows.forEach((row) => {
      const numericErrors = row.errors.filter(
        (e) => e.includes("precio") || e.includes("stock")
      );
      expect(numericErrors).toHaveLength(0);
    });
  });
});

// =====================================================
// validateCsvFile
// =====================================================
describe("validateCsvFile", () => {
  const makeFile = (name: string, size: number) =>
    ({ name, size } as File);

  it("acepta archivo .csv dentro del límite", () => {
    const file = makeFile("productos.csv", 1000);
    expect(validateCsvFile(file).valid).toBe(true);
  });

  it("rechaza archivo sin extensión .csv", () => {
    const file = makeFile("productos.xlsx", 1000);
    const result = validateCsvFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain(".csv");
  });

  it("rechaza archivo mayor a 5MB", () => {
    const file = makeFile("productos.csv", CSV_MAX_SIZE_BYTES + 1);
    const result = validateCsvFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("5 MB");
  });
});

// =====================================================
// parseAndValidateCsv
// =====================================================
describe("parseAndValidateCsv", () => {
  it("totalRows = validRows + errorRows", () => {
    const csv = [
      "nombre,precio,stock",
      "Prod A,100,5",
      ",200,10",
      "Prod C,300,0",
    ].join("\n");
    const result = parseAndValidateCsv(csv, mockCategories, emptySkuMap);
    expect(result.validRows + result.errorRows).toBe(result.totalRows);
  });

  it("CSV vacío retorna 0 filas", () => {
    const result = parseAndValidateCsv("nombre,precio,stock", mockCategories, emptySkuMap);
    expect(result.totalRows).toBe(0);
  });
});
