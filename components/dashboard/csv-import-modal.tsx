"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import { importProductsFromCsv } from "@/lib/actions/csv-import";
import {
  parseAndValidateCsv,
  validateCsvFile,
  generateTemplateCsv,
  CSV_MAX_ROWS,
} from "@/lib/utils/csv-parser";
import type { CsvParseResult, ImportResult } from "@/lib/utils/csv-parser";
import { CsvPreviewTable } from "@/components/dashboard/csv-preview-table";

type ModalState = "idle" | "parsing" | "preview" | "importing" | "done";

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function CsvImportModal({ open, onOpenChange, onImportComplete }: CsvImportModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setState("idle");
      setParseResult(null);
      setImportResult(null);
      setFileError(null);
    }, 300);
  };

  const handleDownloadTemplate = () => {
    const csv = generateTemplateCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Validar archivo
    const validation = validateCsvFile(file);
    if (!validation.valid) {
      setFileError(validation.error ?? "Archivo inválido");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setState("parsing");

    try {
      const text = await file.text();

      // Verificar límite de filas antes de parsear completo
      const lineCount = text.split(/\r?\n/).filter((l) => l.trim().length > 0).length - 1;
      if (lineCount > CSV_MAX_ROWS) {
        setFileError(`El archivo no puede contener más de ${CSV_MAX_ROWS} productos`);
        setState("idle");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (lineCount <= 0) {
        setFileError("El archivo no contiene datos para importar");
        setState("idle");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Cargar categorías y SKUs existentes
      const [categories, existingProducts] = await Promise.all([
        getCategories(),
        getProducts(),
      ]);

      const existingSkuMap = new Map<string, string>();
      for (const p of existingProducts) {
        if (p.sku) existingSkuMap.set(p.sku.trim(), p.id);
      }

      const result = parseAndValidateCsv(text, categories, existingSkuMap);
      setParseResult(result);
      setState("preview");
    } catch (err) {
      setFileError("El archivo no es un CSV válido");
      setState("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult) return;

    const validRows = parseResult.rows.filter((r) => r.status !== "error");
    if (validRows.length === 0) return;

    setState("importing");

    try {
      const result = await importProductsFromCsv(
        validRows.map((r) => ({
          rowNumber: r.rowNumber,
          productData: r.productData!,
          existingProductId: r.existingProductId,
          existingSku: r.existingSku,
        }))
      );
      setImportResult(result);
      setState("done");
    } catch (err: any) {
      toast.error("Error al importar productos");
      setState("preview");
    }
  };

  const handleImportAnother = () => {
    setState("idle");
    setParseResult(null);
    setImportResult(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Productos desde CSV</DialogTitle>
          <DialogDescription>
            Cargá un archivo CSV para importar múltiples productos de forma masiva.
          </DialogDescription>
        </DialogHeader>

        {/* IDLE */}
        {state === "idle" && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
              <p className="font-medium">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Descargá la plantilla CSV de ejemplo</li>
                <li>Completá los datos de tus productos (máx. {CSV_MAX_ROWS} filas, 5 MB)</li>
                <li>Subí el archivo y revisá la vista previa</li>
                <li>Confirmá la importación</li>
              </ol>
              <p className="text-muted-foreground">
                Columnas: <code className="text-xs bg-muted px-1 rounded">nombre, descripcion, precio, precio_costo, stock, sku, categoria, unidad, activo</code>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar archivo CSV
              </Button>
            </div>

            {fileError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {fileError}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* PARSING */}
        {state === "parsing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Procesando archivo...</p>
          </div>
        )}

        {/* PREVIEW */}
        {state === "preview" && parseResult && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{parseResult.totalRows}</p>
                <p className="text-xs text-muted-foreground">Total filas</p>
              </div>
              <div className="rounded-lg border p-3 text-center bg-green-50">
                <p className="text-2xl font-bold text-green-700">{parseResult.validRows}</p>
                <p className="text-xs text-muted-foreground">Válidas</p>
              </div>
              <div className="rounded-lg border p-3 text-center bg-red-50">
                <p className="text-2xl font-bold text-red-700">{parseResult.errorRows}</p>
                <p className="text-xs text-muted-foreground">Con errores</p>
              </div>
            </div>

            <CsvPreviewTable rows={parseResult.rows} />

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleImportAnother}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={parseResult.validRows === 0}
              >
                Confirmar Importación ({parseResult.validRows} productos)
              </Button>
            </div>
          </div>
        )}

        {/* IMPORTING */}
        {state === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Importando productos...</p>
          </div>
        )}

        {/* DONE */}
        {state === "done" && importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {importResult.errors.length === 0 ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">
                  {importResult.errors.length === 0
                    ? "Importación completada exitosamente"
                    : "Importación completada con algunos errores"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {importResult.created} creados · {importResult.updated} actualizados
                  {importResult.errors.length > 0 && ` · ${importResult.errors.length} errores`}
                </p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-destructive">Filas con error:</p>
                {importResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    Fila {e.rowNumber}{e.sku ? ` (${e.sku})` : ""}: {e.error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleImportAnother}>
                <FileText className="mr-2 h-4 w-4" />
                Importar otro archivo
              </Button>
              <Button
                onClick={() => {
                  onImportComplete();
                  handleClose();
                }}
              >
                Ver productos
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
