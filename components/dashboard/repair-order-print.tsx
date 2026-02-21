"use client";

import { forwardRef } from "react";
import type { RepairOrderWithDetails } from "@/lib/types/erp";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RepairOrderPrintProps {
  order: RepairOrderWithDetails;
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

export const RepairOrderPrint = forwardRef<HTMLDivElement, RepairOrderPrintProps>(
  ({ order, companyInfo }, ref) => {
    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        received: "Recibido",
        diagnosing: "En Diagnóstico",
        waiting_parts: "Esperando Repuestos",
        repairing: "En Reparación",
        repaired: "Reparado",
        delivered: "Entregado",
        cancelled: "Cancelado",
      };
      return labels[status] || status;
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
            <h2 className="text-2xl font-bold text-gray-900">ORDEN DE REPARACIÓN</h2>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              #{order.order_number}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Fecha Ingreso: {formatDate(order.received_date)}
            </p>
            {order.estimated_delivery_date && (
              <p className="text-sm text-gray-600">
                Fecha Estimada: {formatDate(order.estimated_delivery_date)}
              </p>
            )}
            <p className="text-sm font-semibold text-gray-700 mt-2">
              Estado: {getStatusLabel(order.status)}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            DATOS DEL CLIENTE
          </h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-semibold text-gray-900">{order.customer.name}</p>
            {order.customer.document_number && (
              <p className="text-sm text-gray-600">
                {order.customer.document_type}: {order.customer.document_number}
              </p>
            )}
            {order.customer.email && (
              <p className="text-sm text-gray-600">{order.customer.email}</p>
            )}
            {order.customer.phone && (
              <p className="text-sm text-gray-600">{order.customer.phone}</p>
            )}
            {order.customer.address && (
              <p className="text-sm text-gray-600 mt-1">
                {order.customer.address}
                {order.customer.city && `, ${order.customer.city}`}
                {order.customer.state && `, ${order.customer.state}`}
              </p>
            )}
          </div>
        </div>

        {/* Device Info */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            INFORMACIÓN DEL DISPOSITIVO
          </h3>
          <div className="bg-gray-50 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Tipo de Dispositivo</p>
                <p className="font-semibold text-gray-900">{order.device_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Marca</p>
                <p className="font-semibold text-gray-900">{order.brand}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Modelo</p>
                <p className="font-semibold text-gray-900">{order.model}</p>
              </div>
              {order.serial_number && (
                <div>
                  <p className="text-xs text-gray-500">Número de Serie</p>
                  <p className="font-semibold text-gray-900">{order.serial_number}</p>
                </div>
              )}
            </div>
            {order.accessories && (
              <div className="mt-3">
                <p className="text-xs text-gray-500">Accesorios Incluidos</p>
                <p className="text-sm text-gray-900">{order.accessories}</p>
              </div>
            )}
          </div>
        </div>

        {/* Problem and Diagnosis */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            PROBLEMA REPORTADO
          </h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-900">{order.reported_problem}</p>
          </div>
          
          {order.diagnosis && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">
                DIAGNÓSTICO
              </h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-900">{order.diagnosis}</p>
                {order.diagnosis_date && (
                  <p className="text-xs text-gray-500 mt-2">
                    Fecha: {formatDate(order.diagnosis_date)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Technician */}
        {order.technician && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              TÉCNICO ASIGNADO
            </h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-semibold text-gray-900">{order.technician.name}</p>
              {order.technician.specialty && (
                <p className="text-sm text-gray-600">
                  Especialidad: {order.technician.specialty}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Budget - Parts and Labor */}
        {(order.items.length > 0 || order.labor_cost > 0) && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              PRESUPUESTO
            </h3>
            
            {/* Parts Table */}
            {order.items.length > 0 && (
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Repuesto
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">
                      Cantidad
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">
                      Precio Unit.
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="p-3">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        {item.product.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                        )}
                      </td>
                      <td className="text-right p-3 text-gray-900">{item.quantity}</td>
                      <td className="text-right p-3 text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="text-right p-3 font-semibold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                {order.items.length > 0 && (
                  <div className="flex justify-between py-2 text-gray-700">
                    <span>Repuestos:</span>
                    <span className="font-semibold">{formatCurrency(order.total_parts)}</span>
                  </div>
                )}
                {order.labor_cost > 0 && (
                  <div className="flex justify-between py-2 text-gray-700">
                    <span>Mano de Obra:</span>
                    <span className="font-semibold">{formatCurrency(order.labor_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-gray-300 text-lg font-bold text-gray-900">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(order.total_cost)}</span>
                </div>
              </div>
            </div>

            {/* Budget Approval Status */}
            {order.budget_approved !== null && (
              <div className="mt-4 p-3 rounded bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">
                  Estado del Presupuesto:{" "}
                  <span className={order.budget_approved ? "text-green-600" : "text-red-600"}>
                    {order.budget_approved ? "APROBADO" : "RECHAZADO"}
                  </span>
                </p>
                {order.approval_date && (
                  <p className="text-xs text-gray-600 mt-1">
                    Fecha: {formatDate(order.approval_date)}
                  </p>
                )}
                {order.approval_notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    Notas: {order.approval_notes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Payment Status */}
        {order.total_paid > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              ESTADO DE PAGO
            </h3>
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Total:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.total_cost)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Pagado:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(order.total_paid)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-semibold text-gray-700">Saldo:</span>
                <span className={`font-bold ${order.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(order.balance)}
                </span>
              </div>
            </div>
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

        {/* Signature Section */}
        <div className="mt-12 pt-6 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-8">
                FIRMA DEL CLIENTE
              </p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-xs text-gray-600">Aclaración</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-8">
                FIRMA DEL TÉCNICO
              </p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-xs text-gray-600">Aclaración</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Gracias por confiar en nuestro servicio técnico</p>
          <p className="mt-1">
            Este documento es una orden de reparación válida
          </p>
        </div>
      </div>
    );
  }
);

RepairOrderPrint.displayName = "RepairOrderPrint";
