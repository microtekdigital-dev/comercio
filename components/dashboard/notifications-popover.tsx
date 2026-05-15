"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Trash2, Loader2 } from "lucide-react";
import {
  getNotifications, getUnreadCount, markAsRead,
  markAllAsRead, deleteNotification, type Notification,
} from "@/lib/actions/notifications";
import { toast } from "sonner";
import Link from "next/link";

const TYPE_ICON: Record<string, string> = {
  low_stock: "📦", pending_payment: "💰", new_sale: "🛒",
  payment_received: "✅", system: "⚙️", sale_return: "↩️",
  repair_status_change: "🔧",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-700", high: "text-orange-700",
  normal: "text-blue-700", low: "text-gray-600",
};

function formatTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (m < 1) return "Ahora";
  if (m < 60) return `Hace ${m}m`;
  if (h < 24) return `Hace ${h}h`;
  if (day < 7) return `Hace ${day}d`;
  return new Date(d).toLocaleDateString("es-AR", { month: "short", day: "numeric" });
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const [notifs, count] = await Promise.all([getNotifications(20), getUnreadCount()]);
    setNotifications(notifs); setUnreadCount(count); setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calcular posición del dropdown al abrir
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(p => Math.max(0, p - 1));
  };

  const handleReadAll = async () => {
    await markAllAsRead();
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    toast.success("Todas marcadas como leídas");
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    const n = notifications.find(n => n.id === id);
    setNotifications(p => p.filter(n => n.id !== id));
    if (n && !n.is_read) setUnreadCount(p => Math.max(0, p - 1));
  };

  const panelWidth = Math.min(320, window.innerWidth - 8);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center hover:bg-[#0000aa] text-white"
        title="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — fixed position to escape overflow:hidden containers */}
      {open && (
        <div
          ref={dropRef}
          className="fixed z-[9999] bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000]"
          style={{ top: dropPos.top, right: dropPos.right, width: panelWidth }}
        >
          {/* Title bar */}
          <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
            <span className="text-white text-xs font-bold">🔔 Notificaciones</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={handleReadAll} title="Marcar todas como leídas"
                  className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-[10px] flex items-center justify-center hover:bg-[#c0c0c0]">
                  <CheckCheck className="h-3 w-3" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-500">
                <Bell className="h-8 w-8 opacity-20" />
                <p className="text-xs">Sin notificaciones</p>
              </div>
            ) : notifications.map((n, idx) => (
              <div key={n.id}
                className={`border-b border-[#e0e0e0] px-3 py-2 ${!n.is_read ? "bg-blue-50" : idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="flex gap-2">
                  <span className="text-base shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-xs font-bold ${PRIORITY_COLOR[n.priority] ?? ""}`}>{n.title}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatTime(n.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {n.link && (
                        <Link href={n.link} onClick={() => { handleRead(n.id); setOpen(false); }}
                          className="text-[10px] text-[#000080] underline hover:text-[#0000cc]">
                          Ver →
                        </Link>
                      )}
                      <div className="flex-1" />
                      {!n.is_read && (
                        <button onClick={() => handleRead(n.id)} title="Marcar como leída"
                          className="w-5 h-5 border border-[#808080] bg-[#d4d0c8] flex items-center justify-center hover:bg-[#c0c0c0]">
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(n.id)} title="Eliminar"
                        className="w-5 h-5 border border-[#808080] bg-[#d4d0c8] flex items-center justify-center hover:bg-[#c0c0c0] text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-[#808080] px-3 py-1 bg-[#d4d0c8]">
            <span className="text-[10px] text-gray-600">{notifications.length} notificación(es)</span>
          </div>
        </div>
      )}
    </div>
  );
}
