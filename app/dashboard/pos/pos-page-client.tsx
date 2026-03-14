"use client";

import { useState } from "react";
import { POSLayout } from "@/components/dashboard/pos/pos-layout";
import { ProductGrid } from "@/components/dashboard/pos/product-grid";
import { ShoppingCart } from "@/components/dashboard/pos/shopping-cart";
import { CustomerSelector } from "@/components/dashboard/pos/customer-selector";
import { PaymentModal } from "@/components/dashboard/pos/payment-modal";
import { usePOSCart } from "@/hooks/use-pos-cart";
import { createPOSSale, generatePOSTicket } from "@/lib/actions/pos";
import type { Category, Customer, ProductVariant } from "@/lib/types/erp";
import type { POSProductSearchResult, POSPayment } from "@/lib/types/pos";
import { CheckCircle, X, Printer, Loader2 } from "lucide-react";

interface POSPageClientProps {
  categories: Category[];
  currencySymbol: string;
  openingId: string;
}

export function POSPageClient({
  categories,
  currencySymbol,
  openingId: _openingId,
}: POSPageClientProps) {
  const { cart, addItem, updateQuantity, removeItem, applyDiscount, clearCart } =
    usePOSCart();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<{ sale_id: string; sale_number: string } | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [printingTicket, setPrintingTicket] = useState(false);

  // --------------------------------------------------
  // handleProductSelect — called by ProductGrid
  // --------------------------------------------------
  function handleProductSelect(
    product: POSProductSearchResult,
    variant?: ProductVariant
  ) {
    // POSProductSearchResult extends Product, so it's compatible with addItem
    addItem(product, variant);
  }

  // --------------------------------------------------
  // handleConfirmPayment — called by PaymentModal
  // --------------------------------------------------
  async function handleConfirmPayment(payments: POSPayment[]) {
    setSaleError(null);

    const result = await createPOSSale({
      customer_id: selectedCustomer?.id ?? null,
      items: cart.items,
      payments,
      discount_type: cart.discount_type,
      discount_value: cart.discount_value,
      notes: null,
      opening_id: _openingId,
    });

    if (!result.success) {
      setSaleError(result.error ?? "Error al procesar la venta");
      return;
    }

    // Success: clear cart, close modal, show success message
    setPaymentModalOpen(false);
    clearCart();
    setSelectedCustomer(null);
    setSaleSuccess({ sale_id: result.sale_id ?? "", sale_number: result.sale_number ?? "" });
  }

  // --------------------------------------------------
  // handlePrintTicket — prints the ticket for the last sale
  // --------------------------------------------------
  async function handlePrintTicket() {
    if (!saleSuccess?.sale_id) return;
    setPrintingTicket(true);
    try {
      const result = await generatePOSTicket(saleSuccess.sale_id);
      if (!result.success || !result.ticket_html) {
        setSaleError(result.error ?? "Error al generar el ticket");
        return;
      }
      const win = window.open("", "_blank", "width=400,height=600");
      if (!win) {
        setSaleError("No se pudo abrir la ventana de impresión. Permite ventanas emergentes.");
        return;
      }
      win.document.write(`<!DOCTYPE html><html><head><title>Ticket</title><style>body{margin:0;padding:0;}</style></head><body>${result.ticket_html}</body></html>`);
      win.document.close();
      win.focus();
      win.print();
    } finally {
      setPrintingTicket(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Success modal */}
      {saleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Venta completada</p>
              {saleSuccess.sale_number && (
                <p className="text-sm text-gray-500 mt-1">Venta #{saleSuccess.sale_number}</p>
              )}
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handlePrintTicket}
                disabled={printingTicket}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {printingTicket ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                Imprimir ticket
              </button>
              <button
                onClick={() => setSaleSuccess(null)}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {saleError && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-red-50 border-red-200 px-4 py-3 shadow-lg max-w-sm">
          <X className="h-5 w-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error en la venta</p>
            <p className="text-xs text-red-700">{saleError}</p>
          </div>
          <button
            onClick={() => setSaleError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Customer selector — above the main layout */}
      <div className="px-4 pt-3 pb-2 border-b">
        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
          onCreateNew={() => {}}
        />
      </div>

      {/* Main POS layout */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <POSLayout
          cartItemCount={cart.items.length}
          productGrid={
            <ProductGrid
              onProductSelect={handleProductSelect}
              categories={categories}
            />
          }
          cart={
            <ShoppingCart
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onApplyDiscount={applyDiscount}
              onCheckout={() => setPaymentModalOpen(true)}
              onClear={clearCart}
            />
          }
        />
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        total={cart.total}
        onConfirm={handleConfirmPayment}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
