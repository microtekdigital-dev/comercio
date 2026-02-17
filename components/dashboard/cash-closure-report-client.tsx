"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import Link from "next/link";
import { CashClosureReport } from "./cash-closure-report";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import type { 
  CashRegisterClosure, 
  CashRegisterOpening,
  Sale,
  CashMovement,
  SupplierPayment 
} from "@/lib/types/erp";

interface CashClosureReportClientProps {
  closure: CashRegisterClosure;
  opening?: CashRegisterOpening | null;
  sales: Sale[];
  cashMovements: CashMovement[];
  supplierPayments: SupplierPayment[];
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    logoUrl?: string;
  };
}

export function CashClosureReportClient({
  closure,
  opening,
  sales,
  cashMovements,
  supplierPayments,
  companyInfo,
}: CashClosureReportClientProps) {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `cierre-caja-${closure.id}-${formatDate(closure.closure_date)}`,
    onAfterPrint: () => {
      toast.success("Documento enviado a impresora");
    },
    onPrintError: (error) => {
      console.error("Error al imprimir:", error);
      toast.error("Error al imprimir. Intente nuevamente.");
    },
  });

  const handleExportPDF = () => {
    if (reportRef.current) {
      window.print();
      toast.success("Use la opción 'Guardar como PDF' en el diálogo de impresión");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cash-register">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Informe de Cierre de Caja</h2>
            <p className="text-muted-foreground">
              Detalle completo del cierre
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Report */}
      <div className="bg-white rounded-lg shadow-sm">
        <CashClosureReport
          ref={reportRef}
          closure={closure}
          opening={opening}
          sales={sales}
          cashMovements={cashMovements}
          supplierPayments={supplierPayments}
          companyInfo={companyInfo}
        />
      </div>
    </div>
  );
}
