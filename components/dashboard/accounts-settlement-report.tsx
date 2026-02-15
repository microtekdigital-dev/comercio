"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getSales } from "@/lib/actions/sales";
import { getPurchaseOrders } from "@/lib/actions/purchase-orders";
import {
  processAccountsReceivable,
  processAccountsPayable,
  calculateFinancialSummary,
  exportAccountsSettlementToExcel,
  exportAccountsSettlementToPDF,
} from "@/lib/actions/accounts-settlement";
import { AccountsSettlementSummary } from "./accounts-settlement-summary";
import { AccountsReceivableTable } from "./accounts-receivable-table";
import { AccountsPayableTable } from "./accounts-payable-table";
import type {
  AccountReceivable,
  AccountPayable,
  FinancialSummary,
  ExportData,
} from "@/lib/types/accounts-settlement";
import { useToast } from "@/hooks/use-toast";

interface AccountsSettlementReportProps {
  companyId: string;
  companyName: string;
  currency?: string;
}

export function AccountsSettlementReport({
  companyId,
  companyName,
  currency = "ARS",
}: AccountsSettlementReportProps) {
  const [cutoffDate, setCutoffDate] = useState<Date>(new Date());
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalReceivable: 0,
    totalPayable: 0,
    netBalance: 0,
  });
  const { toast } = useToast();

  // Load data when cutoff date changes
  useEffect(() => {
    loadData();
  }, [cutoffDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get sales and purchase orders up to cutoff date
      const dateTo = cutoffDate.toISOString().split("T")[0];
      
      const [sales, orders] = await Promise.all([
        getSales({ dateTo }),
        getPurchaseOrders({ dateTo }),
      ]);

      // Process data
      const receivables = processAccountsReceivable(sales, cutoffDate);
      const payables = processAccountsPayable(orders, cutoffDate);
      const financialSummary = calculateFinancialSummary(receivables, payables);

      setAccountsReceivable(receivables);
      setAccountsPayable(payables);
      setSummary(financialSummary);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Error al cargar los datos del reporte",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData: ExportData = {
        cutoffDate,
        summary,
        accountsReceivable,
        accountsPayable,
        companyName,
        currency,
        generatedAt: new Date(),
      };
      exportAccountsSettlementToExcel(exportData);
      toast({
        title: "Exportación exitosa",
        description: "El archivo Excel se ha descargado correctamente",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description: "Error al exportar el reporte a Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    try {
      const exportData: ExportData = {
        cutoffDate,
        summary,
        accountsReceivable,
        accountsPayable,
        companyName,
        currency,
        generatedAt: new Date(),
      };
      exportAccountsSettlementToPDF(exportData);
      toast({
        title: "Exportación exitosa",
        description: "El archivo PDF se ha descargado correctamente",
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Error",
        description: "Error al exportar el reporte a PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with date picker and export buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Liquidación de Cuentas
          </h2>
          <p className="text-muted-foreground">
            Estado consolidado de cuentas por cobrar y pagar
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !cutoffDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {cutoffDate ? (
                  format(cutoffDate, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={cutoffDate}
                onSelect={(date) => date && setCutoffDate(date)}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleExportExcel} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Exportar a PDF
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <AccountsSettlementSummary
        totalReceivable={summary.totalReceivable}
        totalPayable={summary.totalPayable}
        netBalance={summary.netBalance}
        currency={currency}
      />

      {/* Accounts Receivable Table */}
      <AccountsReceivableTable
        data={accountsReceivable}
        currency={currency}
        isLoading={isLoading}
      />

      {/* Accounts Payable Table */}
      <AccountsPayableTable
        data={accountsPayable}
        currency={currency}
        isLoading={isLoading}
      />
    </div>
  );
}
