"use client";

import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { exportCashClosureToPDF } from "@/lib/utils/export";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import type { CompanySettings } from "@/lib/types/erp";

interface CashClosureReportActionsProps {
  closureId: string;
  closureDate: string;
  reportRef: React.RefObject<HTMLDivElement | null>;
  closure?: any;
  opening?: any;
  sales?: any[];
  cashMovements?: any[];
  supplierPayments?: any[];
  companyInfo?: { name: string; address?: string; phone?: string; email?: string; taxId?: string };
  settings?: CompanySettings | null;
}

export function CashClosureReportActions({
  closureId,
  closureDate,
  reportRef,
  closure,
  opening,
  sales = [],
  cashMovements = [],
  supplierPayments = [],
  companyInfo = { name: "Mi Empresa" },
  settings,
}: CashClosureReportActionsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!closure) {
      toast.info("Use la opción 'Guardar como PDF' en el diálogo de impresión");
      window.print();
      return;
    }

    try {
      const formatCurrency = (amount: number) =>
        settings
          ? formatCompanyCurrency(amount, settings)
          : `$${amount.toFixed(2)}`;

      exportCashClosureToPDF({
        closure,
        opening,
        sales,
        cashMovements,
        supplierPayments,
        companyInfo,
        formatCurrency,
      });

      toast.success("PDF generado correctamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar PDF");
    }
  };

  return (
    <div className="flex gap-2 no-print flex-wrap">
      <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
        <Printer className="h-4 w-4" />
        Imprimir
      </Button>
      <Button onClick={handleExportPDF} className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Exportar PDF
      </Button>
    </div>
  );
}
