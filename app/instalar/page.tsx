"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, CheckCircle2, Download, Chrome } from "lucide-react";

export default function InstalarPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [platform, setPlatform] = useState<"windows" | "android" | "ios" | "other">("other");

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    // Detectar plataforma
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");
    else if (/windows/.test(ua)) setPlatform("windows");

    // Capturar el evento de instalación (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detectar cuando se instala
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstalling(false);
    setInstallPrompt(null);
  };

  if (installed) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1.5">
            <span className="text-white text-sm font-bold">✅ Sistema POS</span>
          </div>
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-700 mx-auto" />
            <div>
              <p className="text-sm font-bold text-black">¡App instalada correctamente!</p>
              <p className="text-xs text-gray-600 mt-1">
                Buscá el ícono "Sistema POS" en tu escritorio o menú inicio.
              </p>
            </div>
            <a
              href="/pos"
              className="block border border-[#808080] bg-[#d4d0c8] px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-center text-black"
            >
              🧾 Abrir el POS ahora
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1.5 flex items-center gap-2">
          <div className="w-4 h-4 bg-[#d4d0c8] border border-[#808080] flex items-center justify-center text-[8px]">🧾</div>
          <span className="text-white text-sm font-bold">Instalar Sistema POS</span>
        </div>

        <div className="p-5 space-y-4 text-black">
          {/* Header */}
          <div className="text-center border-2 border-[#808080] bg-white p-4 shadow-[inset_1px_1px_2px_#808080]">
            <div className="text-5xl mb-2">🧾</div>
            <div className="text-sm font-bold text-[#000080]">Sistema POS</div>
            <div className="text-xs text-gray-500 mt-1">Punto de Venta y Gestión Comercial</div>
          </div>

          {/* Botón instalar automático (Chrome/Edge/Android) */}
          {installPrompt && (
            <div className="space-y-2">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full border-2 border-[#000080] bg-[#000080] text-white px-4 py-3 text-sm font-bold shadow-[3px_3px_0px_#000] hover:bg-[#0000aa] active:shadow-none disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                {installing ? "Instalando..." : "Instalar ahora"}
              </button>
              <p className="text-[10px] text-gray-500 text-center">
                Se instalará en tu dispositivo como una app nativa
              </p>
            </div>
          )}

          {/* Instrucciones manuales según plataforma */}
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080]">
            <div className="bg-[#c0c0c0] border-b border-[#808080] px-3 py-1">
              <span className="text-xs font-bold flex items-center gap-1">
                {platform === "ios" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                {platform === "ios" ? "Instrucciones para iPhone/iPad" :
                 platform === "android" ? "Instrucciones para Android" :
                 "Instrucciones para PC (Windows/Mac)"}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {platform === "ios" ? (
                <ol className="space-y-2 text-xs text-gray-700">
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">1.</span> Abrí esta página en <strong>Safari</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">2.</span> Tocá el botón <strong>Compartir</strong> (cuadrado con flecha ↑) en la barra inferior</li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">3.</span> Deslizá y tocá <strong>"Agregar a pantalla de inicio"</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">4.</span> Tocá <strong>"Agregar"</strong> — listo ✓</li>
                </ol>
              ) : platform === "android" ? (
                <ol className="space-y-2 text-xs text-gray-700">
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">1.</span> Abrí esta página en <strong>Chrome</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">2.</span> Tocá el menú <strong>⋮</strong> (tres puntos) arriba a la derecha</li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">3.</span> Tocá <strong>"Instalar app"</strong> o <strong>"Agregar a pantalla de inicio"</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">4.</span> Tocá <strong>"Instalar"</strong> — listo ✓</li>
                </ol>
              ) : (
                <ol className="space-y-2 text-xs text-gray-700">
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">1.</span> Abrí esta página en <strong>Chrome</strong> o <strong>Edge</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">2.</span> Buscá el ícono <strong>⊕</strong> o <strong>pantalla con flecha</strong> en la barra de direcciones</li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">3.</span> Hacé click en <strong>"Instalar Sistema POS"</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-[#000080] shrink-0">4.</span> Hacé click en <strong>"Instalar"</strong> — listo ✓</li>
                </ol>
              )}
            </div>
          </div>

          {/* Nota sobre Chrome */}
          {!installPrompt && platform !== "ios" && (
            <div className="border border-[#ffc107] bg-[#fff3cd] p-2 flex items-start gap-2">
              <Chrome className="h-4 w-4 text-yellow-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-yellow-800">
                Para instalar automáticamente, abrí esta página en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.
              </p>
            </div>
          )}

          {/* Link directo al POS */}
          <div className="border-t border-[#808080] pt-3 text-center">
            <p className="text-[10px] text-gray-500 mb-2">¿Preferís usar sin instalar?</p>
            <a
              href="/pos"
              className="inline-block border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-black"
            >
              🧾 Abrir el POS en el navegador
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
