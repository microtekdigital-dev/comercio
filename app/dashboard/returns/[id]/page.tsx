import { getReturn } from "@/lib/actions/returns";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const REASON_LABELS: Record<string, string> = {
  defective_product: "Producto defectuoso",
  wrong_product: "Producto equivocado",
  customer_changed_mind: "Cambio de opinión",
  damaged_in_transit: "Dañado en tránsito",
  other: "Otro",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  customer_credit: "Crédito al cliente",
};

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ret = await getReturn(id);
  if (!ret) notFound();

  const sale = ret.sale as any;
  const creditNote = ret.credit_note as any;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ret.return_number}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(ret.return_date), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <Link href="/dashboard/returns" className="text-sm text-primary underline">
          ← Volver al listado
        </Link>
      </div>

      {/* Info general */}
      <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4 text-sm">
        <div>
          <p className="text-muted-foreground">Venta de origen</p>
          {sale ? (
            <Link href={`/dashboard/sales/${ret.sale_id}`} className="text-primary underline font-medium">
              #{sale.sale_number}
            </Link>
          ) : (
            <p className="font-medium">-</p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground">Cliente</p>
          <p className="font-medium">{sale?.customer?.name ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Motivo</p>
          <p className="font-medium">{REASON_LABELS[ret.reason] ?? ret.reason}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Método de devolución</p>
          <p className="font-medium">{METHOD_LABELS[ret.refund_method] ?? ret.refund_method}</p>
        </div>
        {ret.reason_notes && (
          <div className="col-span-2">
            <p className="text-muted-foreground">Descripción</p>
            <p className="font-medium">{ret.reason_notes}</p>
          </div>
        )}
      </div>

      {/* Ítems devueltos */}
      <div>
        <h2 className="text-base font-semibold mb-2">Ítems devueltos</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Producto</th>
                <th className="text-right px-4 py-3 font-medium">Cant.</th>
                <th className="text-right px-4 py-3 font-medium">Precio unit.</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(ret.items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    {item.product_name}
                    {item.variant_name && (
                      <span className="ml-1 text-muted-foreground text-xs">({item.variant_name})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    ${Number(item.unit_price).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${Number(item.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30">
                <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total devuelto</td>
                <td className="px-4 py-3 text-right font-bold">
                  ${Number(ret.total_amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Nota de crédito */}
      {creditNote && (
        <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-1">
          <h2 className="text-base font-semibold mb-2">Nota de Crédito</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground">Número</p>
              <p className="font-medium font-mono">{creditNote.note_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Monto</p>
              <p className="font-medium">
                ${Number(creditNote.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <p className="font-medium capitalize">{creditNote.status === "applied" ? "Aplicada" : "Pendiente"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
