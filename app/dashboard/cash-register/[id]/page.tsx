"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getClosureReportData } from "@/lib/actions/cash-register";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CashClosureReport } from "@/components/dashboard/cash-closure-report";
import { CashClosureReportActions } from "@/components/dashboard/cash-closure-report-actions";
import type { 
  CashRegisterClosure, 
  CashRegisterOpening, 
  Sale, 
  CashMovement, 
  SupplierPayment 
} from "@/lib/types/erp";

export default function CashRegisterClosureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const closureId = params.id as string;
  const reportRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [closure, setClosure] = useState<CashRegisterClosure | null>(null);
  const [opening, setOpening] = useState<CashRegisterOpening | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [companyInfo, setCompanyInfo] = useState<{
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    logoUrl?: string;
  }>({ name: "Mi Empresa" });

  useEffect(() => {
    loadReportData();
  }, [closureId]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const result = await getClosureReportData(closureId);

      if ("error" in result) {
        toast.error(result.error);
        router.push("/dashboard/cash-register");
        return;
      }

      setClosure(result.closure);
      setOpening(result.opening || null);
      setSales(result.sales);
      setCashMovements(result.cashMovements);
      setSupplierPayments(result.supplierPayments);
      setCompanyInfo(result.companyInfo);
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Error al cargar el reporte");
      router.push("/dashboard/cash-register");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (!closure) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se encontró el cierre</p>
          <Link href="/dashboard/cash-register">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la lista
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
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
        <CashClosureReportActions
          closureId={closureId}
          closureDate={closure.closure_date}
          reportRef={reportRef}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
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
