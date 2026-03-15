import { getReturns } from "@/lib/actions/returns";
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

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; reason?: string; refundMethod?: string }>;
}) {
  const params = await searchParams;
  const returns = await getReturns({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    reason: params.reason,
    refundMethod: params.refundMethod,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Devoluciones</h1>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 bg-muted/40 p-4 rounded-lg">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input
            type="date"
            name="dateFrom"
            defaultValue={params.dateFrom ?? ""}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input
            type="date"
            name="dateTo"
            defaultValue={params.dateTo ?? ""}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Motivo</label>
          <select
            name="reason"
            defaultValue={params.reason ?? ""}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(REASON_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Método</label>
          <select
            name="refundMethod"
            defaultValue={params.refundMethod ?? ""}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(METHOD_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-sm"
          >
            Filtrar
          </button>
        </div>
        {(params.dateFrom || params.dateTo || params.reason || params.refundMethod) && (
          <div className="flex items-end">
            <Link
              href="/dashboard/returns"
              className="text-sm text-muted-foreground underline"
            >
              Limpiar
            </Link>
          </div>
        )}
      </form>

      {/* Table */}
      {returns.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay devoluciones registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">N° Devolución</th>
                <th className="text-left px-4 py-3 font-medium">Venta</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Monto</th>
                <th className="text-left px-4 py-3 font-medium">Método</th>
                <th className="text-left px-4 py-3 font-medium">Motivo</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {returns.map((ret) => {
                const sale = ret.sale as any;
                return (
                  <tr key={ret.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono">{ret.return_number}</td>
                    <td className="px-4 py-3">
                      {sale ? (
                        <Link
                          href={`/dashboard/sales/${ret.sale_id}`}
                          className="text-primary underline"
                        >
                          #{sale.sale_number}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sale?.customer?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ${Number(ret.total_amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      {METHOD_LABELS[ret.refund_method] ?? ret.refund_method}
                    </td>
                    <td className="px-4 py-3">
                      {REASON_LABELS[ret.reason] ?? ret.reason}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(ret.return_date), "dd/MM/yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/returns/${ret.id}`}
                        className="text-primary text-xs underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
