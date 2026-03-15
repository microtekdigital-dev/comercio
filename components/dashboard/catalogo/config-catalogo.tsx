"use client";

import { useState, useTransition } from "react";
import { toggleCatalogo, guardarPersonalizacion } from "@/lib/actions/catalogo";
import type { CatalogSettings, PlanTier } from "@/lib/types/catalogo";
import { Copy, Check, Globe, Lock } from "lucide-react";

interface Props {
  settings: CatalogSettings | null;
  planTier: PlanTier;
  catalogUrl: string | null;
}

export function ConfigCatalogo({ settings, planTier, catalogUrl }: Props) {
  const [isActive, setIsActive] = useState(settings?.is_active ?? false);
  const [copied, setCopied] = useState(false);
  const [color, setColor] = useState(settings?.primary_color ?? "#3B82F6");
  const [isPending, startTransition] = useTransition();
  const [savingColor, setSavingColor] = useState(false);

  function handleToggle() {
    const newValue = !isActive;
    setIsActive(newValue);
    startTransition(async () => {
      await toggleCatalogo(newValue);
    });
  }

  function handleCopy() {
    if (!catalogUrl) return;
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveColor() {
    setSavingColor(true);
    await guardarPersonalizacion(color);
    setSavingColor(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Estado del catálogo</h2>
            <p className="text-sm text-gray-500">
              {isActive ? "Tu catálogo está visible al público" : "Tu catálogo está oculto"}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          role="switch"
          aria-checked={isActive}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isActive ? "bg-blue-600" : "bg-gray-200"
          } ${isPending ? "opacity-60" : ""}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* URL pública */}
      {isActive && catalogUrl && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <span className="text-sm text-blue-700 flex-1 truncate">{catalogUrl}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </button>
        </div>
      )}

      {/* Personalización */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-medium text-gray-900 text-sm">Personalización de marca</h3>
          {planTier !== "empresarial" && (
            <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              <Lock className="h-3 w-3" />
              Plan Empresarial
            </span>
          )}
        </div>

        {planTier === "empresarial" ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Color primario</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <button
              onClick={handleSaveColor}
              disabled={savingColor}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {savingColor ? "Guardando..." : "Guardar"}
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400">
            Personalizá el color y logo de tu catálogo con el Plan Empresarial.
          </div>
        )}
      </div>
    </div>
  );
}
