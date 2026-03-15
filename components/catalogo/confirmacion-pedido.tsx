"use client";

import { CheckCircle } from "lucide-react";

interface Props {
  orderNumber: string;
  onBack: () => void;
}

export function ConfirmacionPedido({ orderNumber, onBack }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">¡Pedido enviado!</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Tu pedido fue recibido. El negocio se va a comunicar con vos para confirmar.
      </p>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-6 py-3 mb-6">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Número de pedido</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orderNumber}</p>
      </div>
      <button
        onClick={onBack}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors"
      >
        Volver al catálogo
      </button>
    </div>
  );
}
