"use client";

import { useState, useEffect, useRef } from "react";
import { getSale, updateSale, addSalePayment, deleteSale, hasElectronicInvoice, getElectronicInvoiceForSale } from "@/lib/actions/sales";
import { getCompanyInfo } from "@/lib/actions/company";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { sendInvoiceEmail } from "@/lib/actions/email";
import { getUserPermissions } from "@/lib/utils/permissions";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import { Printer, Mail, Trash2, Receipt, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { InvoicePrint } from "@/components/dashboard/invoice-print";
import { PaymentManager } from "@/components/dashboard/payment-manager";
import { SaleReturnsSection } from "@/components/dashboard/sale-returns-section";
import type { Sale } from "@/lib/types/erp";

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", completed: "Completada", cancelled: "Cancelada" };
const STATUS_COLORS: Record<string, string> = { draft: "text-gray-600", completed: "text-green-700", cancelled: "text-red-600" };
const PAY_LABELS: Record<string, string> = { pending: "Pendiente", partial: "Parcial", paid: "Pagado", refunded: "Reembolsado" };
const PAY_COLORS: Record<string, string> = { pending: "text-amber-700", partial: "text-blue-700", paid: "text-green-700", refunded: "text-red-600" };

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [saleId, setSaleId] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyPosition, setCurrencyPosition] = useState<"before" | "after">("before");
  const [electronicInvoice, setElectronicInvoice] = useState<any>(null);
  const [hasEInvoice, setHasEInvoice] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ contentRef: invoiceRef, documentTitle: `Factura-${sale?.sale_number || ""}` });

  useEffect(() => {
    params.then((p) => {
      setSaleId(p.id);
      loadSale(p.id);
      loadCompanyInfo();
      checkPermissions();
      loadCurrencySettings();
      loadElectronicInvoice(p.id);
    });
  }, []);

  const loadCurrencySettings = async () => { const s = await getCompanySettings(); if (s) { setCurrencySymbol(s.currency_symbol); setCurrencyPosition(s.currency_position); } };
  const checkPermissions = async () => { const p = await getUserPermissions(); setCanDelete(p.canDeleteSales); setCanEdit(p.canEditSales); };
  const loadSale = async (id: string) => { const d = await getSale(id); if (d) { setSale(d); setStatus(d.status); setEmailTo(d.customer?.email || ""); } };
  const loadCompanyInfo = async () => {
    const d = await getCompanyInfo(); const s = await getCompanySettings();
    setCompanyInfo({ name: d?.name || "Mi Empresa", address: d?.address, phone: d?.phone, email: d?.email, taxId: d?.tax_id, logoUrl: d?.logo_url, termsAndConditions: d?.terms_and_conditions, currencySymbol: s?.currency_symbol || "$", currencyPosition: s?.currency_position || "before" });
  };
  const loadElectronicInvoice = async (id: string) => {
    const r = await hasElectronicInvoice(id);
    if (r.success && r.hasInvoice) { setHasEInvoice(true); const inv = await getElectronicInvoiceForSale(id); if (inv.success && inv.invoice) setElectronicInvoice(inv.invoice); }
  };

  const handleUpdateStatus = async () => {
    if (!sale || !saleId) return;
    setLoading(true);
    try {
      const r = await updateSale(saleId, { status: status as any });
      if (r.error) { toast.error(r.error); } else { toast.success("Estado actualizado"); loadSale(saleId); }
    } catch { toast.error("Error al actualizar"); } finally { setLoading(false); }
  };

  const handleSendEmail = async () => {
    if (!emailTo || !sale) { toast.error("Ingresá un email válido"); return; }
    setSendingEmail(true);
    try {
      const r = await sendInvoiceEmail({ saleId: sale.id, recipientEmail: emailTo });
      if (r.error) { toast.error(r.error); } else { toast.success(r.message || `Enviado a ${emailTo}`); setEmailDialogOpen(false); }
    } catch { toast.error("Error al enviar"); } finally { setSendingEmail(false); }
  };

  const handleDelete = async () => {
    if (!saleId) return;
    setLoading(true);
    try {
      const r = await deleteSale(saleId);
      if (r.error) { toast.error(r.error); } else { toast.success("Venta eliminada"); router.push("/dashboard/sales"); }
    } catch { toast.error("Error al eliminar"); } finally { setLoading(false); setConfirmDelete(false); }
  };

  const fmt = (n: number) => formatCompanyCurrency(n, { currency_symbol: currencySymbol, currency_position: currencyPosition });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });

  if (!sale) return (
    <div className="flex items-center justify-center py-16 text-xs text-gray-500 gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
      <div className="bg-[#c0c0c0] border-b border-[#808080] px-3 py-1">
        <span className="text-xs font-bold">{title}</span>
      </div>
      <div className="bg-white p-3">{children}</div>
    </div>
  );

  return (
    <div className="space-y-3 text-black select-none">
      {/* Hidden invoice for printing */}
      <div className="hidden">
        {sale && companyInfo && <InvoicePrint ref={invoiceRef} sale={sale} companyInfo={companyInfo} />}
      </div>

      {/* Title bar */}
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/sales" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
            <span className="text-white text-sm font-bold">🛒 Venta {sale.sale_number}</span>
            <span className={`text-xs font-bold ${STATUS_COLORS[sale.status] ?? "text-white"} bg-white px-1.5 py-0.5 border border-[#808080]`}>
              {STATUS_LABELS[sale.status] ?? sale.status}
            </span>
            <span className={`text-xs font-bold ${PAY_COLORS[sale.payment_status] ?? "text-white"} bg-white px-1.5 py-0.5 border border-[#808080]`}>
              {PAY_LABELS[sale.payment_status] ?? sale.payment_status}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => handlePrint()} disabled={!companyInfo}
              className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1 text-black">
              <Printer className="h-3 w-3" /> Imprimir
            </button>
            <button onClick={() => setEmailDialogOpen(true)}
              className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
              <Mail className="h-3 w-3" /> Email
            </button>
            {canDelete && (
              <button onClick={() => setConfirmDelete(true)} disabled={loading}
                className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] text-red-700 flex items-center gap-1 disabled:opacity-50">
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* Info general */}
        <div className="md:col-span-2 space-y-3">
          <Section title="Información General">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">Fecha:</span> <span className="font-bold">{fmtDate(sale.sale_date)}</span></div>
              {sale.due_date && <div><span className="text-gray-500">Vencimiento:</span> <span className="font-bold">{fmtDate(sale.due_date)}</span></div>}
              {sale.customer && <div><span className="text-gray-500">Cliente:</span> <span className="font-bold">{sale.customer.name}</span></div>}
              {sale.payment_method && <div><span className="text-gray-500">Método de pago:</span> <span className="font-bold capitalize">{sale.payment_method}</span></div>}
            </div>
            {sale.notes && <div className="mt-2 pt-2 border-t border-[#e0e0e0] text-xs text-gray-600">{sale.notes}</div>}
          </Section>

          {/* Change status */}
          {canEdit && (
            <Section title="Cambiar Estado">
              <div className="flex items-center gap-2">
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none flex-1">
                  <option value="draft">Borrador</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <button onClick={handleUpdateStatus} disabled={loading || status === sale.status}
                  className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "✔"} Actualizar
                </button>
              </div>
            </Section>
          )}
        </div>

        {/* Resumen */}
        <Section title="Resumen">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-mono">{fmt(sale.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Impuestos:</span><span className="font-mono">{fmt(sale.tax_amount)}</span></div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Descuento:</span><span className="font-mono text-red-600">-{fmt(sale.discount_amount)}</span></div>
            )}
            <div className="border-t-2 border-[#808080] pt-1.5 flex justify-between font-bold text-base">
              <span>Total:</span><span className="font-mono">{fmt(sale.total)}</span>
            </div>
          </div>
        </Section>
      </div>

      {/* Items */}
      <Section title="Artículos de la Venta">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[1fr_60px_100px_60px_100px] border-b-2 border-[#808080] bg-[#d4d0c8] min-w-[500px]">
            {["Producto", "Cant.", "Precio Unit.", "Desc.", "Total"].map((h, i) => (
              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
            ))}
          </div>
          {sale.items && sale.items.length > 0 ? sale.items.map((item, idx) => (
            <div key={item.id} className={`grid grid-cols-[1fr_60px_100px_60px_100px] border-b border-[#e0e0e0] min-w-[500px] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
              <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">
                <div className="font-medium">{item.product_name}</div>
                {item.variant_name && <div className="text-gray-500 text-[10px]">Talle: {item.variant_name}</div>}
                {item.product_sku && <div className="text-gray-400 text-[10px]">SKU: {item.product_sku}</div>}
              </div>
              <div className="px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0]">{item.quantity}</div>
              <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0]">{fmt(item.unit_price)}</div>
              <div className="px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0]">{item.discount_percent}%</div>
              <div className="px-2 py-1.5 text-xs text-right font-mono font-bold">{fmt(item.total)}</div>
            </div>
          )) : (
            <div className="text-center py-6 text-xs text-gray-500">Sin artículos</div>
          )}
        </div>
      </Section>

      {/* Electronic invoice */}
      {hasEInvoice && electronicInvoice && (
        <Section title="📄 Factura Electrónica">
          <div className="grid grid-cols-3 gap-3 text-xs mb-3">
            <div><span className="text-gray-500">Tipo:</span> <span className="font-bold">{electronicInvoice.invoice_type.replace(/_/g, ' ')}</span></div>
            <div><span className="text-gray-500">Número:</span> <span className="font-mono font-bold">{String(electronicInvoice.point_of_sale).padStart(5,'0')}-{String(electronicInvoice.invoice_number).padStart(8,'0')}</span></div>
            <div><span className="text-gray-500">Estado:</span> <span className={`font-bold ${electronicInvoice.status === 'AUTHORIZED' ? 'text-green-700' : electronicInvoice.status === 'REJECTED' ? 'text-red-600' : 'text-amber-700'}`}>{electronicInvoice.status}</span></div>
          </div>
          {electronicInvoice.cae && (
            <div className="border-t border-[#e0e0e0] pt-2 grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">CAE:</span> <span className="font-mono font-bold">{electronicInvoice.cae}</span></div>
              {electronicInvoice.cae_expiration_date && <div><span className="text-gray-500">Vencimiento CAE:</span> <span className="font-bold">{fmtDate(electronicInvoice.cae_expiration_date)}</span></div>}
            </div>
          )}
          <div className="mt-2">
            <Link href={`/dashboard/arca/invoices/${electronicInvoice.id}`}
              className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] inline-flex items-center gap-1">
              Ver Detalle →
            </Link>
          </div>
        </Section>
      )}

      {!hasEInvoice && sale.status === 'completed' && (
        <Section title="📄 Facturación Electrónica">
          <p className="text-xs text-gray-600 mb-2">Esta venta no tiene factura electrónica. Podés generar una para cumplir con las obligaciones fiscales.</p>
          <Link href={`/dashboard/arca/invoices/new?saleId=${sale.id}`}
            className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] inline-flex items-center gap-1">
            <Receipt className="h-3 w-3" /> Generar Factura Electrónica
          </Link>
        </Section>
      )}

      {/* Payment manager */}
      <PaymentManager
        sale={sale}
        onPaymentAdded={() => loadSale(saleId)}
        onAddPayment={async (payment) => addSalePayment(saleId, payment.amount, payment.paymentMethod, payment.referenceNumber, payment.notes)}
      />

      {/* Returns */}
      <SaleReturnsSection saleId={saleId} saleStatus={sale.status} salePaymentStatus={sale.payment_status} />

      {/* Email modal */}
      {emailDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-sm">
            <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
              <span className="text-white text-sm font-bold">📧 Enviar Factura por Email</span>
              <button onClick={() => setEmailDialogOpen(false)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-black block mb-0.5">Email del destinatario</label>
                <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="cliente@ejemplo.com"
                  className="border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full" />
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-[#808080]">
                <button onClick={() => setEmailDialogOpen(false)} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</button>
                <button onClick={handleSendEmail} disabled={sendingEmail} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                  {sendingEmail ? <><Loader2 className="h-3 w-3 animate-spin" /> Enviando...</> : "✔ Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-sm">
            <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
              <span className="text-white text-sm font-bold">⚠ Eliminar Venta</span>
              <button onClick={() => setConfirmDelete(false)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-bold">¿Eliminar esta venta?</p>
              <p className="text-xs text-gray-600">Esta acción no se puede deshacer. Se eliminará la venta y se restaurará el stock.</p>
              <div className="flex justify-end gap-2 pt-1 border-t border-[#808080]">
                <button onClick={() => setConfirmDelete(false)} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</button>
                <button onClick={handleDelete} disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-red-700 disabled:opacity-50 flex items-center gap-1">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "✕"} Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
