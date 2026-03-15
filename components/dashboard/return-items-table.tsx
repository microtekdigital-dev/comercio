"use client";

import type { SaleItem } from "@/lib/types/erp";

interface ReturnItemRow {
  sale_item_id: string;
  product_name: string;
  variant_name: string | null;
  quantity_sold: number;
  quantity_available: number;
  unit_price: number;
  quantity_to_return: number;
}

interface ReturnItemsTableProps {
  items: ReturnItemRow[];
  onChange: (saleItemId: string, quantity: number) => void;
}

export function ReturnItemsTable({ items, onChange }: ReturnItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Producto</th>
            <th className="text-right px-4 py-3 font-medium">Vendido</th>
            <th className="text-right px-4 py-3 font-medium">Disponible</th>
            <th className="text-right px-4 py-3 font-medium">Precio unit.</th>
            <th className="text-right px-4 py-3 font-medium">A devolver</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.sale_item_id} className="hover:bg-muted/20">
              <td className="px-4 py-3">
                {item.product_name}
                {item.variant_name && (
                  <span className="ml-1 text-muted-foreground text-xs">
                    ({item.variant_name})
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">{item.quantity_sold}</td>
              <td className="px-4 py-3 text-right">{item.quantity_available}</td>
              <td className="px-4 py-3 text-right">
                ${Number(item.unit_price).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right">
                <input
                  type="number"
                  min={0}
                  max={item.quantity_available}
                  value={item.quantity_to_return}
                  onChange={(e) =>
                    onChange(item.sale_item_id, Math.min(Number(e.target.value), item.quantity_available))
                  }
                  className="w-20 border rounded px-2 py-1 text-right text-sm"
                  disabled={item.quantity_available === 0}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
