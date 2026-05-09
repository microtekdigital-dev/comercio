"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";
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
  const overlayRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setState("idle");
    setParseResult(null);
    setImportResult(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(reset, 300);
  }, [onOpenChange, reset]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) handleClose();
    },
    [handleClose]
  );

  const handleDownloadTemplate = useCallback(() => {
    const csv = generateTemplateCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    const validation = validateCsvFile(file);
    if (!validation.valid) {
      setFileError(validation.error ?? "Archivo inválido");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setState("parsing");

    try {
      const text = await file.text();
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
    } catch {
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
    } catch {
      toast.error("Error al importar productos");
      setState("preview");
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      {/* Ventana retro */}
      <div className="w-full max-w-4xl mx-4 border-2 border-[#808080] shadow-[4px_4px_0px_#000] flex flex-col max-h-[90vh]">

        {/* Barra de título */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between flex-shrink-0">
          <span className="text-white text-sm font-bold">📥 Importar Productos desde CSV</span>
          <button
            onClick={handleClose}
            className="text-white hover:bg-[#cc0000] px-2 py-0.5 text-xs font-bold border border-[#6060a0]"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="bg-[#d4d0c8] p-4 overflow-y-auto flex-1 space-y-3">

          {/* ── IDLE ── */}
          {state === "idle" && (
            <div className="space-y-3">
              {/* Instrucciones */}
              <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3">
                <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
                  <span className="text-xs font-bold">Instrucciones</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-700">
                  <li>Descargá la plantilla CSV de ejemplo</li>
                  <li>Completá los datos de tus productos (máx. {CSV_MAX_ROWS} filas, 5 MB)</li>
                  <li>Subí el archivo y revisá la vista previa</li>
                  <li>Confirmá la importación</li>
                </ol>
                <div className="mt-2 text-xs text-gray-600">
                  Columnas:{" "}
                  <code className="bg-[#f0f0f0] border border-[#c0c0c0] px-1 text-[10px] font-mono">
                    nombre, descripcion, precio, precio_costo, stock, sku, categoria, unidad, activo
                  </code>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-2 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center justify-center gap-2"
                >
                  <Download className="h-3 w-3" /> Descargar Plantilla
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border border-[#808080] bg-[#d4d0c8] px-4 py-2 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center justify-center gap-2"
                >
                  <Upload className="h-3 w-3" /> Seleccionar archivo CSV...
                </button>
              </div>

              {fileError && (
                <div className="border-2 border-[#cc0000] bg-[#fff0f0] p-2 flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
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

          {/* ── PARSING ── */}
          {state === "parsing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="text-sm text-gray-600 font-bold">Procesando archivo...</p>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {state === "preview" && parseResult && (
            <div className="space-y-3">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total filas", value: parseResult.totalRows, color: "" },
                  { label: "Válidas", value: parseResult.validRows, color: "text-green-700" },
                  { label: "Con errores", value: parseResult.errorRows, color: "text-red-700" },
                ].map((s) => (
                  <div key={s.label} className="border-2 border-[#808080] bg-white p-2 text-center shadow-[inset_1px_1px_2px_#808080]">
                    <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              <CsvPreviewTable rows={parseResult.rows} />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={reset}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={parseResult.validRows === 0}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-40"
                >
                  ✔ Confirmar Importación ({parseResult.validRows} productos)
                </button>
              </div>
            </div>
          )}

          {/* ── IMPORTING ── */}
          {state === "importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="text-sm text-gray-600 font-bold">Importando productos...</p>
            </div>
          )}

          {/* ── DONE ── */}
          {state === "done" && importResult && (
            <div className="space-y-3">
              {/* Resultado */}
              <div className={`border-2 p-3 flex items-start gap-3 ${
                importResult.errors.length === 0
                  ? "border-[#28a745] bg-[#d4edda]"
                  : "border-[#ffc107] bg-[#fff3cd]"
              }`}>
                {importResult.errors.length === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-bold">
                    {importResult.errors.length === 0
                      ? "Importación completada exitosamente"
                      : "Importación completada con algunos errores"}
                  </p>
                  <p className="text-xs text-gray-700 mt-0.5">
                    {importResult.created} creados · {importResult.updated} actualizados
                    {importResult.errors.length > 0 && ` · ${importResult.errors.length} errores`}
                  </p>
                </div>
              </div>

              {/* Errores */}
              {importResult.errors.length > 0 && (
                <div className="border-2 border-[#cc0000] bg-[#fff0f0] p-3 space-y-1 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-red-700 mb-1">Filas con error:</p>
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-[10px] text-gray-700 font-mono">
                      Fila {e.rowNumber}{e.sku ? ` (${e.sku})` : ""}: {e.error}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={reset}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" /> Importar otro archivo
                </button>
                <button
                  onClick={() => { onImportComplete(); handleClose(); }}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]"
                >
                  Ver productos
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#d4d0c8] border-t-2 border-[#808080] px-3 py-2 flex justify-end flex-shrink-0">
          <button
            onClick={handleClose}
            className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
