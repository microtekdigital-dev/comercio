"use client";

import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { toast } from "sonner";

interface CashClosureReportActionsProps {
  closureId: string;
  closureDate: string;
  reportRef: React.RefObject<HTMLDivElement | null>;
}

export function CashClosureReportActions({
  closureId,
  closureDate,
  reportRef
}: CashClosureReportActionsProps) {
  const formatDateForFilename = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrint = () => {
    if (reportRef.current) {
      window.print();
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) {
      toast.error("No se pudo generar el PDF");
      return;
    }

    try {
      // Use browser's print to PDF functionality
      toast.info("Use la opción 'Guardar como PDF' en el diálogo de impresión");
      window.print();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar PDF. Intente nuevamente.");
    }
  };

  return (
    <div className="flex gap-2 no-print flex-wrap">
      <Button
        onClick={handlePrint}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Imprimir
      </Button>
      <Button
        onClick={handleExportPDF}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Exportar PDF
      </Button>
    </div>
  );
}
