"use client";

import { forwardRef } from "react";
import type { 
  CashRegisterClosure, 
  CashRegisterOpening, 
  Sale, 
  CashMovement, 
  SupplierPayment 
} from "@/lib/types/erp";
import { 
  DollarSign, 
  Wallet, 
  CreditCard, 
  Smartphone, 
  TrendingUp, 
  TrendingDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface CashClosureReportProps {
  closure: CashRegisterClosure;
  opening?: CashRegisterOpening | null;
  sales: Sale[];
  cashMovements: CashMovement[];
  supplierPayments: SupplierPayment[];
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    logoUrl?: string;
  };
}

export const CashClosureReport = forwardRef<HTMLDivElement, CashClosureReportProps>(
  ({ closure, opening, sales, cashMovements, supplierPayments, companyInfo }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: closure.currency,
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

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Calculate cash reconciliation
    const initialCash = opening?.initial_cash_amount || 0;
    const cashSales = closure.cash_sales;
    const supplierPaymentsCash = closure.supplier_payments_cash;
    
    const cashMovementsIncome = cashMovements
      .filter(m => m.movement_type === "income")
      .reduce((sum, m) => sum + m.amount, 0);
    
    const cashMovementsWithdrawals = cashMovements
      .filter(m => m.movement_type === "withdrawal")
      .reduce((sum, m) => sum + m.amount, 0);
    
    const expectedCash = initialCash + cashSales - supplierPaymentsCash + cashMovementsIncome - cashMovementsWithdrawals;
    const cashCounted = closure.cash_counted;
    const difference = cashCounted !== null ? cashCounted - expectedCash : null;

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
            <h2 className="text-2xl font-bold text-gray-900">CIERRE DE CAJA</h2>
            <p className="text-sm text-gray-600 mt-2">
              Fecha: {formatDate(closure.closure_date)}
            </p>
            {closure.shift && (
              <p className="text-sm text-gray-600">
                Turno: {closure.shift}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Cerrado por: {closure.closed_by_name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDateTime(closure.created_at)}
            </p>
          </div>
        </div>

        {/* Opening Information */}
        {opening && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              INFORMACIÓN DE APERTURA
            </h3>
            <div className="bg-gray-50 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Abierto por</p>
                <p className="font-semibold text-gray-900">{opening.opened_by_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha y hora de apertura</p>
                <p className="font-semibold text-gray-900">{formatDateTime(opening.opening_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monto inicial</p>
                <p className="font-semibold text-green-600">{formatCurrency(opening.initial_cash_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Turno</p>
                <p className="font-semibold text-gray-900">{opening.shift}</p>
              </div>
            </div>
          </div>
        )}

        {!opening && closure.opening_id && (
          <div className="mb-8">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="text-sm text-yellow-800">
                Sin apertura vinculada
              </p>
            </div>
          </div>
        )}

        {/* Sales Summary */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            RESUMEN DE VENTAS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
            <div className="bg-primary/10 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm text-gray-600">Total Ventas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(closure.total_sales_amount)}</p>
              <p className="text-xs text-gray-500 mt-1">{closure.total_sales_count} ventas</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border p-3 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <Wallet className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-gray-600">Efectivo</span>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(closure.cash_sales)}</p>
              </div>

              <div className="border p-3 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-gray-600">Tarjeta</span>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(closure.card_sales)}</p>
              </div>

              <div className="border p-3 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <Smartphone className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-gray-600">Transferencia</span>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(closure.transfer_sales)}</p>
              </div>

              {closure.other_sales > 0 && (
                <div className="border p-3 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-gray-600">Otros</span>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(closure.other_sales)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supplier Payments Summary - ALWAYS SHOW */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            RESUMEN DE PAGOS A PROVEEDORES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDown className="h-5 w-5 text-red-600" />
                <span className="text-sm text-gray-600">Total Pagos</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(closure.supplier_payments_total)}</p>
              <p className="text-xs text-gray-500 mt-1">{supplierPayments.length} pagos</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border p-3 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <Wallet className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-gray-600">Efectivo</span>
                </div>
                <p className="font-semibold text-red-600">{formatCurrency(closure.supplier_payments_cash)}</p>
              </div>

              <div className="border p-3 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <CreditCard className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-gray-600">Tarjeta</span>
                </div>
                <p className="font-semibold text-red-600">{formatCurrency(closure.supplier_payments_card || 0)}</p>
              </div>

              <div className="border p-3 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <Smartphone className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-gray-600">Transferencia</span>
                </div>
                <p className="font-semibold text-red-600">{formatCurrency(closure.supplier_payments_transfer || 0)}</p>
              </div>

              {(closure.supplier_payments_other || 0) > 0 && (
                <div className="border p-3 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-gray-600">Otros</span>
                  </div>
                  <p className="font-semibold text-red-600">{formatCurrency(closure.supplier_payments_other)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Sales List */}
        <div className="mb-8 avoid-break">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            DETALLE DE VENTAS
          </h3>
          {sales.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Nº Venta</th>
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Cliente</th>
                  <th className="text-right p-2 text-xs font-semibold text-gray-700">Monto</th>
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Método de Pago</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-200">
                    <td className="p-2 text-gray-900">{sale.sale_number}</td>
                    <td className="p-2 text-gray-900">{sale.customer?.name || "Cliente General"}</td>
                    <td className="text-right p-2 text-gray-900">{formatCurrency(sale.total)}</td>
                    <td className="p-2 text-gray-900 capitalize">{sale.payment_method || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bg-gray-50 p-4 rounded text-center text-gray-500 text-sm">
              No se registraron ventas en este período
            </div>
          )}
        </div>

        {/* Cash Movements */}
        {cashMovements.length > 0 && (
          <div className="mb-8 avoid-break">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              MOVIMIENTOS DE CAJA
            </h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Tipo</th>
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Descripción</th>
                  <th className="text-right p-2 text-xs font-semibold text-gray-700">Monto</th>
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {cashMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-gray-200">
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        {movement.movement_type === "income" ? (
                          <>
                            <ArrowUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-600 font-medium">Ingreso</span>
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3 text-red-500" />
                            <span className="text-red-600 font-medium">Retiro</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-gray-900">{movement.description}</td>
                    <td className="text-right p-2">
                      <span className={movement.movement_type === "income" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {movement.movement_type === "income" ? "+" : "-"}{formatCurrency(movement.amount)}
                      </span>
                    </td>
                    <td className="p-2 text-gray-600 text-xs">{formatDateTime(movement.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Supplier Payments */}
        {supplierPayments.length > 0 && (
          <div className="mb-8 avoid-break">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              DETALLE DE PAGOS A PROVEEDORES
            </h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Proveedor</th>
                  <th className="text-right p-2 text-xs font-semibold text-gray-700">Monto</th>
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Método</th>
                  <th className="text-left p-2 text-xs font-semibold text-gray-700">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {supplierPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-200">
                    <td className="p-2 text-gray-900">{payment.supplier?.name || "Proveedor desconocido"}</td>
                    <td className="text-right p-2 text-red-600 font-semibold">{formatCurrency(payment.amount)}</td>
                    <td className="p-2 text-gray-900 capitalize">{payment.payment_method}</td>
                    <td className="p-2 text-gray-600">{payment.reference_number || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cash Reconciliation */}
        <div className="mb-8 avoid-break">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            RECONCILIACIÓN DE EFECTIVO
          </h3>
          <div className="bg-gray-50 p-4 rounded">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monto inicial de apertura:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(initialCash)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">+ Ventas en efectivo:</span>
                <span className="font-semibold text-green-600">{formatCurrency(cashSales)}</span>
              </div>
              {supplierPaymentsCash > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">- Pagos a proveedores:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(supplierPaymentsCash)}</span>
                </div>
              )}
              {cashMovementsIncome > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">+ Ingresos de caja:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(cashMovementsIncome)}</span>
                </div>
              )}
              {cashMovementsWithdrawals > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">- Retiros de caja:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(cashMovementsWithdrawals)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-gray-300 font-semibold">
                <span className="text-gray-700">Efectivo esperado:</span>
                <span className="text-gray-900">{formatCurrency(expectedCash)}</span>
              </div>
              {cashCounted !== null && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Efectivo contado:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(cashCounted)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t-2 border-gray-300 font-bold">
                    <span className="text-gray-700">Diferencia:</span>
                    <span className={
                      difference! < 0 
                        ? "text-red-600" 
                        : difference! > 0 
                        ? "text-green-600" 
                        : "text-gray-900"
                    }>
                      {formatCurrency(difference!)}
                      {difference! < 0 && " (Faltante)"}
                      {difference! > 0 && " (Sobrante)"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {closure.notes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">NOTAS</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-700 whitespace-pre-line">{closure.notes}</p>
            </div>
          </div>
        )}

        {/* Signature Line */}
        <div className="mt-12 pt-6 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="border-t border-gray-400 w-64 mb-2"></div>
              <p className="text-sm text-gray-600">Firma del responsable</p>
              <p className="text-xs text-gray-500 mt-1">{closure.closed_by_name}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Documento generado el {formatDateTime(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CashClosureReport.displayName = "CashClosureReport";
