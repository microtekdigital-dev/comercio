"use client";

import { forwardRef } from "react";
import type { Sale } from "@/lib/types/erp";

interface InvoicePrintProps {
  sale: Sale;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    logoUrl?: string;
    termsAndConditions?: string;
  };
}

export const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ sale, companyInfo }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: sale.currency,
        minimumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
          <div>
            {companyInfo?.logoUrl && (
              <img 
                src={companyInfo.logoUrl} 
                alt={companyInfo.name} 
                className="h-16 mb-4 object-contain"
              />
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {companyInfo?.name || "Mi Empresa"}
            </h1>
            {companyInfo?.address && (
              <p className="text-sm text-gray-600 mt-1">{companyInfo.address}</p>
            )}
            {companyInfo?.phone && (
              <p className="text-sm text-gray-600">Tel: {companyInfo.phone}</p>
            )}
            {companyInfo?.email && (
              <p className="text-sm text-gray-600">Email: {companyInfo.email}</p>
            )}
            {companyInfo?.taxId && (
              <p className="text-sm text-gray-600">CUIT: {companyInfo.taxId}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">FACTURA</h2>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              {sale.sale_number}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Fecha: {formatDate(sale.sale_date)}
            </p>
            {sale.due_date && (
              <p className="text-sm text-gray-600">
                Vencimiento: {formatDate(sale.due_date)}
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        {sale.customer && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              CLIENTE
            </h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-semibold text-gray-900">{sale.customer.name}</p>
              {sale.customer.document_number && (
                <p className="text-sm text-gray-600">
                  {sale.customer.document_type}: {sale.customer.document_number}
                </p>
              )}
              {sale.customer.email && (
                <p className="text-sm text-gray-600">{sale.customer.email}</p>
              )}
              {sale.customer.phone && (
                <p className="text-sm text-gray-600">{sale.customer.phone}</p>
              )}
              {sale.customer.address && (
                <p className="text-sm text-gray-600 mt-1">
                  {sale.customer.address}
                  {sale.customer.city && `, ${sale.customer.city}`}
                  {sale.customer.state && `, ${sale.customer.state}`}
                  {sale.customer.postal_code && ` (${sale.customer.postal_code})`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">
                  Producto/Servicio
                </th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">
                  Cantidad
                </th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">
                  Precio Unit.
                </th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">
                  Desc.
                </th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-gray-600 font-medium">Talle: {item.variant_name}</p>
                    )}
                    {item.product_sku && (
                      <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                    )}
                  </td>
                  <td className="text-right p-3 text-gray-900">{item.quantity}</td>
                  <td className="text-right p-3 text-gray-900">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="text-right p-3 text-gray-900">
                    {item.discount_percent}%
                  </td>
                  <td className="text-right p-3 font-semibold text-gray-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 text-gray-700">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-700">
              <span>Impuestos:</span>
              <span className="font-semibold">{formatCurrency(sale.tax_amount)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between py-2 text-red-600">
                <span>Descuento:</span>
                <span className="font-semibold">
                  -{formatCurrency(sale.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-gray-300 text-lg font-bold text-gray-900">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {sale.payment_method && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Método de Pago:</span>{" "}
              <span className="capitalize">{sale.payment_method}</span>
            </p>
          </div>
        )}

        {/* Notes */}
        {sale.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">NOTAS</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {sale.notes}
            </p>
          </div>
        )}

        {/* Terms and Conditions */}
        {companyInfo?.termsAndConditions && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              TÉRMINOS Y CONDICIONES
            </h3>
            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-line">
              {companyInfo.termsAndConditions}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Gracias por su compra</p>
          <p className="mt-1">
            Este documento es una representación impresa de una factura electrónica
          </p>
        </div>
      </div>
    );
  }
);

InvoicePrint.displayName = "InvoicePrint";
