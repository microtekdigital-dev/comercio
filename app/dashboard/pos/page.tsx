import { getCategories } from "@/lib/actions/categories";
import { getActiveCashRegisterOpening } from "@/lib/actions/pos";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { POSPageClient } from "./pos-page-client";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function POSPage() {
  const [categories, opening, settings] = await Promise.all([
    getCategories(),
    getActiveCashRegisterOpening(),
    getCompanySettings(),
  ]);

  // Requirement 3.1: validate active cash register opening before allowing access
  if (!opening) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="rounded-full bg-amber-100 p-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold">Caja no abierta</h2>
          <p className="text-muted-foreground">
            Para acceder al Punto de Venta necesitás tener una caja abierta.
            Abrí la caja antes de comenzar a vender.
          </p>
          <Button asChild className="mt-2">
            <Link href="/dashboard/cash-register/opening/new">
              Abrir caja
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const currencySymbol = settings?.currency_symbol ?? "$";

  return (
    <POSPageClient
      categories={categories}
      currencySymbol={currencySymbol}
      openingId={opening.id}
    />
  );
}
