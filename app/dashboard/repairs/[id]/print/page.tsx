"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRepairOrderById } from "@/lib/actions/repair-orders";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RepairOrderPrint } from "@/components/dashboard/repair-order-print";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import type { RepairOrderWithDetails } from "@/lib/types/erp";

export default function RepairPrintPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<RepairOrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrder();
    loadCompanyInfo();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await getRepairOrderById(params.id as string);
      if (data) {
        setOrder(data);
      }
    } catch (error) {
      console.error("Error loading repair order:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyInfo = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      if (company) {
        setCompanyInfo({
          name: company.name,
          address: company.address,
          phone: company.phone,
          email: company.email,
          taxId: company.tax_id,
          logoUrl: company.logo_url,
          termsAndConditions: company.terms_and_conditions,
        });
      }
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Orden-Reparacion-${order?.order_number}`,
  });

  const handleDownloadPDF = () => {
    // For now, just trigger print which allows saving as PDF
    // In the future, could use a library like jsPDF for direct PDF generation
    handlePrint();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Orden de reparación no encontrada</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Action Bar */}
      <div className="max-w-5xl mx-auto mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Preview */}
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <RepairOrderPrint
              ref={printRef}
              order={order}
              companyInfo={companyInfo}
            />
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          @page {
            margin: 0.5cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
