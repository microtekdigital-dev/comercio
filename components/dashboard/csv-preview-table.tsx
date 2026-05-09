"use client";

import { useState } from "react";
import type { ParsedImportRow } from "@/lib/utils/csv-parser";

interface CsvPreviewTableProps {
  rows: ParsedImportRow[];
  maxPreviewRows?: number;
}

const PAGE_SIZE = 100;

export function CsvPreviewTable({ rows, maxPreviewRows = PAGE_SIZE }: CsvPreviewTableProps) {
  const [page, setPage] = useState(0);

  const start = page * maxPreviewRows;
  const end = start + maxPreviewRows;
  const visibleRows = rows.slice(start, end);
  const totalPages = Math.ceil(rows.length / maxPreviewRows);

  const statusBadge = (row: ParsedImportRow) => {
    if (row.status === "valid_create")
      return (
        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold border border-[#28a745] bg-[#d4edda] text-[#155724]">
          Crear
        </span>
      );
    if (row.status === "valid_update")
      return (
        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold border border-[#004085] bg-[#cce5ff] text-[#004085]">
          Actualizar
        </span>
      );
    return (
      <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold border border-[#721c24] bg-[#f8d7da] text-[#721c24]">
        Error
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border-2 border-[#808080]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#d4d0c8] border-b-2 border-[#808080]">
              {["Fila", "Estado", "Nombre", "SKU", "Precio", "Stock", "Cat.", "Error"].map((h, i) => (
                <th
                  key={i}
                  className={`px-2 py-1 font-bold border-r border-[#808080] last:border-r-0 ${i >= 3 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => (
              <tr
                key={row.rowNumber}
                className={`border-b border-[#e0e0e0] ${
                  row.status === "error"
                    ? "bg-[#fff0f0]"
                    : idx % 2 === 0
                    ? "bg-white"
                    : "bg-[#f5f5f5]"
                }`}
              >
                <td className="px-2 py-1 border-r border-[#e0e0e0] font-mono">{row.rowNumber}</td>
                <td className="px-2 py-1 border-r border-[#e0e0e0]">{statusBadge(row)}</td>
                <td className="px-2 py-1 border-r border-[#e0e0e0] max-w-[140px] truncate">
                  {row.productData?.name ?? "—"}
                </td>
                <td className="px-2 py-1 border-r border-[#e0e0e0] font-mono">
                  {row.productData?.sku ?? row.existingSku ?? "—"}
                </td>
                <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono">
                  {row.productData?.price != null ? row.productData.price : "—"}
                </td>
                <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono">
                  {row.productData?.stock_quantity ?? "—"}
                </td>
                <td className="px-2 py-1 border-r border-[#e0e0e0] text-center">
                  {row.productData?.category_id ? "✓" : "—"}
                </td>
                <td className="px-2 py-1 text-red-700 max-w-[180px] truncate" title={row.errors.join("; ")}>
                  {row.errors.join("; ") || null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Mostrando {start + 1}–{Math.min(end, rows.length)} de {rows.length} filas
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
