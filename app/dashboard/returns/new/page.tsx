import { getSale } from "@/lib/actions/sales";
import { getReturnsBySale } from "@/lib/actions/returns";
import { NewReturnClient } from "./new-return-client";
import { notFound, redirect } from "next/navigation";

export default async function NewReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ saleId?: string }>;
}) {
  const params = await searchParams;
  if (!params.saleId) redirect("/dashboard/sales");

  const [sale, existingReturns] = await Promise.all([
    getSale(params.saleId),
    getReturnsBySale(params.saleId),
  ]);

  if (!sale) notFound();
  if (sale.status !== "completed") redirect(`/dashboard/sales/${params.saleId}`);

  // Calculate already returned quantities per sale_item
  const returnedQty: Record<string, number> = {};
  for (const ret of existingReturns) {
    for (const item of ret.items ?? []) {
      returnedQty[item.sale_item_id] = (returnedQty[item.sale_item_id] ?? 0) + item.quantity;
    }
  }

  const itemRows = (sale.items ?? []).map((si) => ({
    sale_item_id: si.id,
    product_name: si.product_name,
    variant_name: si.variant_name ?? null,
    quantity_sold: si.quantity,
    quantity_available: si.quantity - (returnedQty[si.id] ?? 0),
    unit_price: si.unit_price,
    item_total: si.total,
    quantity_to_return: 0,
  }));

  return (
    <NewReturnClient
      sale={sale}
      itemRows={itemRows}
      hasCustomer={!!sale.customer_id}
    />
  );
}
