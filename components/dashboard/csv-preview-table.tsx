"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Crear</Badge>;
    if (row.status === "valid_update")
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Actualizar</Badge>;
    return <Badge variant="destructive">Error</Badge>;
  };

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Fila #</TableHead>
              <TableHead className="w-28">Estado</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow
                key={row.rowNumber}
                className={row.status === "error" ? "bg-red-50" : undefined}
              >
                <TableCell className="font-mono text-sm">{row.rowNumber}</TableCell>
                <TableCell>{statusBadge(row)}</TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {row.productData?.name ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {row.productData?.sku ?? row.existingSku ?? "—"}
                </TableCell>
                <TableCell>
                  {row.productData?.price != null
                    ? `$${row.productData.price}`
                    : "—"}
                </TableCell>
                <TableCell>{row.productData?.stock_quantity ?? "—"}</TableCell>
                <TableCell className="max-w-[120px] truncate">
                  {row.productData?.category_id ? "✓" : "—"}
                </TableCell>
                <TableCell className="text-destructive text-sm max-w-[200px]">
                  {row.errors.join("; ") || null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {start + 1}–{Math.min(end, rows.length)} de {rows.length} filas
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
