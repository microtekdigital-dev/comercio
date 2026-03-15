import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  parseCsvText,
  validateRow,
  parseAndValidateCsv,
  validateCsvFile,
  CSV_MAX_SIZE_BYTES,
} from "@/lib/utils/csv-parser";
import type { Category } from "@/lib/types/erp";

const makeCategory = (id: string, name: string): Category => ({
  id,
  company_id: "co-1",
  name,
  description: null,
  parent_id: null,
  color: null,
  icon: null,
  sort_order: 0,
  is_active: true,
  created_at: "",
  updated_at: "",
});

const emptySkuMap = new Map<string, string>();

// Generador de nombre de columna CSV seguro (sin comas ni saltos)
const safeString = fc.string({ minLength: 1, maxLength: 30 }).filter(
  (s) => !s.includes(",") && !s.includes("\n") && !s.includes("\r") && s.trim().length > 0
);

const positivePrice = fc.float({ min: Math.fround(0.01), max: Math.fround(999999), noNaN: true, noDefaultInfinity: true });
const nonNegativeInt = fc.integer({ min: 0, max: 99999 });

// =====================================================
// Property 1: Parseo preserva conteo de filas
// Feature: importacion-masiva-productos, Property 1
// =====================================================
describe("Property 1: Parseo preserva conteo de filas", () => {
  it("parseCsvText retorna exactamente N filas para N filas de datos", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            nombre: safeString,
            precio: positivePrice.map(String),
            stock: nonNegativeInt.map(String),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (dataRows) => {
          const header = "nombre,precio,stock";
          const lines = dataRows.map(
            (r) => `${r.nombre},${r.precio},${r.stock}`
          );
          const csv = [header, ...lines].join("\n");
          const parsed = parseCsvText(csv);
          expect(parsed).toHaveLength(dataRows.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 2: Validación no se detiene ante errores individuales
// Feature: importacion-masiva-productos, Property 2
// =====================================================
describe("Property 2: Validación no se detiene ante errores individuales", () => {
  it("validRows + errorRows === totalRows para cualquier CSV mixto", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            // fila válida
            fc.record({
              nombre: safeString,
              precio: positivePrice.map(String),
              stock: nonNegativeInt.map(String),
            }),
            // fila inválida (nombre vacío)
            fc.record({
              nombre: fc.constant(""),
              precio: positivePrice.map(String),
              stock: nonNegativeInt.map(String),
            })
          ),
          { minLength: 1, maxLength: 50 }
        ),
        (dataRows) => {
          const header = "nombre,precio,stock";
          const lines = dataRows.map((r) => `${r.nombre},${r.precio},${r.stock}`);
          const csv = [header, ...lines].join("\n");
          const result = parseAndValidateCsv(csv, [], emptySkuMap);
          expect(result.validRows + result.errorRows).toBe(result.totalRows);
          expect(result.totalRows).toBe(dataRows.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 3: Validación de campos requeridos y numéricos
// Feature: importacion-masiva-productos, Property 3
// =====================================================
describe("Property 3: Validación de campos requeridos y numéricos", () => {
  it("nombre vacío siempre produce error", () => {
    fc.assert(
      fc.property(
        fc.record({
          precio: positivePrice.map(String),
          stock: nonNegativeInt.map(String),
        }),
        ({ precio, stock }) => {
          const row = { rowNumber: 1, rawData: { nombre: "", precio, stock } };
          const result = validateRow(row, [], emptySkuMap);
          expect(result.status).toBe("error");
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("precio negativo o cero siempre produce error", () => {
    fc.assert(
      fc.property(
        fc.float({ max: Math.fround(0), noNaN: true, noDefaultInfinity: true }),
        (precio) => {
          const row = {
            rowNumber: 1,
            rawData: { nombre: "Prod", precio: String(precio), stock: "5" },
          };
          const result = validateRow(row, [], emptySkuMap);
          expect(result.status).toBe("error");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("stock negativo siempre produce error", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -99999, max: -1 }),
        (stock) => {
          const row = {
            rowNumber: 1,
            rawData: { nombre: "Prod", precio: "100", stock: String(stock) },
          };
          const result = validateRow(row, [], emptySkuMap);
          expect(result.status).toBe("error");
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 4: Resolución de categorías es case-insensitive
// Feature: importacion-masiva-productos, Property 4
// =====================================================
describe("Property 4: Resolución de categorías es case-insensitive", () => {
  it("categoría con variaciones de mayúsculas se resuelve correctamente", () => {
    fc.assert(
      fc.property(
        safeString,
        fc.string({ minLength: 0, maxLength: 10 }).filter((s) => !s.includes(",") && !s.includes("\n")),
        (catName, prefix) => {
          const category = makeCategory("cat-test", catName);
          // Variación: uppercase
          const upperName = catName.toUpperCase();
          const row = {
            rowNumber: 1,
            rawData: { nombre: "Prod", precio: "100", stock: "5", categoria: upperName },
          };
          const result = validateRow(row, [category], emptySkuMap);
          // Si el nombre en uppercase coincide con el nombre de la categoría (case-insensitive)
          if (catName.toLowerCase() === upperName.toLowerCase()) {
            expect(result.status).not.toBe("error");
            expect(result.productData?.category_id).toBe("cat-test");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("categoría inexistente siempre produce error", () => {
    fc.assert(
      fc.property(
        safeString,
        safeString,
        (catName, otherName) => {
          fc.pre(catName.toLowerCase() !== otherName.toLowerCase());
          const category = makeCategory("cat-test", catName);
          const row = {
            rowNumber: 1,
            rawData: { nombre: "Prod", precio: "100", stock: "5", categoria: otherName },
          };
          const result = validateRow(row, [category], emptySkuMap);
          expect(result.status).toBe("error");
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 5: Upsert por SKU — crear vs actualizar
// Feature: importacion-masiva-productos, Property 5
// =====================================================
describe("Property 5: Upsert por SKU — crear vs actualizar", () => {
  it("SKU existente → valid_update; SKU nuevo → valid_create; sin SKU → valid_create", () => {
    fc.assert(
      fc.property(
        // SKU sin espacios al inicio/final para que el trim del parser no cambie el valor
        safeString.filter((s) => s.length > 0 && s === s.trim()),
        (sku) => {
          const existingSkuMap = new Map([[sku, "prod-id-1"]]);

          // SKU existente
          const rowExisting = {
            rowNumber: 1,
            rawData: { nombre: "Prod", precio: "100", stock: "5", sku },
          };
          const resultExisting = validateRow(rowExisting, [], existingSkuMap);
          expect(resultExisting.status).toBe("valid_update");
          expect(resultExisting.existingProductId).toBe("prod-id-1");

          // SKU nuevo (diferente)
          const newSku = sku + "_new";
          const rowNew = {
            rowNumber: 2,
            rawData: { nombre: "Prod", precio: "100", stock: "5", sku: newSku },
          };
          const resultNew = validateRow(rowNew, [], existingSkuMap);
          expect(resultNew.status).toBe("valid_create");

          // Sin SKU
          const rowNoSku = {
            rowNumber: 3,
            rawData: { nombre: "Prod", precio: "100", stock: "5", sku: "" },
          };
          const resultNoSku = validateRow(rowNoSku, [], existingSkuMap);
          expect(resultNoSku.status).toBe("valid_create");
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 9: Límites de archivo son correctamente aplicados
// Feature: importacion-masiva-productos, Property 9
// =====================================================
describe("Property 9: Límites de archivo son correctamente aplicados", () => {
  it("archivo mayor a 5MB es rechazado", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: CSV_MAX_SIZE_BYTES + 1, max: CSV_MAX_SIZE_BYTES * 2 }),
        (size) => {
          const file = { name: "productos.csv", size } as File;
          const result = validateCsvFile(file);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("archivo dentro del límite es aceptado", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: CSV_MAX_SIZE_BYTES }),
        (size) => {
          const file = { name: "productos.csv", size } as File;
          const result = validateCsvFile(file);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// =====================================================
// Property 10: Valores de activo son parseados correctamente
// Feature: importacion-masiva-productos, Property 10
// =====================================================
describe("Property 10: Valores de activo son parseados correctamente", () => {
  const validActivoValues = ["true", "false", "1", "0", "si", "sí", "no", "TRUE", "FALSE", "SI", "NO"];

  it("valores válidos de activo no producen error", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validActivoValues),
        (activo) => {
          const row = {
            rowNumber: 1,
            rawData: { nombre: "Prod", precio: "100", stock: "5", activo },
          };
          const result = validateRow(row, [], emptySkuMap);
          const activoErrors = result.errors.filter((e) => e.includes("activo"));
          expect(activoErrors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("valores inválidos de activo producen error", () => {
    const invalidValues = ["maybe", "yes", "nope", "verdadero", "falso", "2", "-1", "ok"];
    fc.assert(
      fc.property(
        fc.constantFrom(...invalidValues),
        (activo) => {
          const row = {
            rowNumber: 1,
            rawData: { nombre: "Prod", precio: "100", stock: "5", activo },
          };
          const result = validateRow(row, [], emptySkuMap);
          expect(result.status).toBe("error");
        }
      ),
      { numRuns: 50 }
    );
  });
});
