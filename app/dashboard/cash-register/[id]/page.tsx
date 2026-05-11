"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getClosureReportData } from "@/lib/actions/cash-register";
import { getCompanySettings } from "@/lib/actions/company-settings";
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
  SupplierPayment,
  CompanySettings
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
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [companyInfo, setCompanyInfo] = useState<{
    name: string; address?: string; phone?: string; email?: string; taxId?: string; logoUrl?: string;
  }>({ name: "Mi Empresa" });

  useEffect(() => {
    loadReportData();
    getCompanySettings().then(setSettings).catch(console.error);
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
    } catch {
      toast.error("Error al cargar el reporte");
      router.push("/dashboard/cash-register");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando reporte...
      </div>
    );
  }

  if (!closure || !settings) {
    return (
      <div className="space-y-3 text-black">
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">💰 Informe de Cierre</span>
          </div>
          <div className="bg-[#d4d0c8] p-6 text-center space-y-3">
            <p className="text-sm font-bold">No se encontró el cierre</p>
            <Link href="/dashboard/cash-register"
              className="inline-block border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
              ← Volver a la lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/cash-register" className="text-blue-200 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-white text-sm font-bold">💰 Informe de Cierre de Caja</span>
          </div>
          <CashClosureReportActions
            closureId={closureId}
            closureDate={closure.closure_date}
            reportRef={reportRef}
            closure={closure}
            opening={opening}
            sales={sales}
            cashMovements={cashMovements}
            supplierPayments={supplierPayments}
            companyInfo={companyInfo}
            settings={settings}
          />
        </div>

        {/* Report body */}
        <div className="bg-white">
          <CashClosureReport
            ref={reportRef}
            closure={closure}
            opening={opening}
            sales={sales}
            cashMovements={cashMovements}
            supplierPayments={supplierPayments}
            settings={settings}
            companyInfo={companyInfo}
          />
        </div>
      </div>
    </div>
  );
}
