"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserTickets, getTicketWithMessages, createSupportTicket, sendSupportMessage, markMessagesAsRead, updateTicketStatus } from "@/lib/actions/support";
import type { SupportTicket, SupportMessage, TicketCategory, TicketPriority } from "@/lib/types/support";
import { ArrowLeft, Send, Plus, Loader2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = { open: "Abierto", in_progress: "En Progreso", resolved: "Resuelto", closed: "Cerrado" };
const STATUS_COLORS: Record<string, string> = { open: "text-blue-700", in_progress: "text-amber-700", resolved: "text-green-700", closed: "text-gray-500" };

interface SupportChatWidgetProps {
  onClose: () => void;
}

export function SupportChatWidget({ onClose }: SupportChatWidgetProps) {
  const [view, setView] = useState<"list" | "chat" | "new">("list");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [newTicketData, setNewTicketData] = useState({ subject: "", message: "", priority: "medium" as TicketPriority, category: "general" as TicketCategory });

  useEffect(() => { loadTickets(); }, []);

  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase.channel(`ticket-${selectedTicket}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${selectedTicket}` },
        (payload) => { setMessages(prev => [...prev, payload.new as SupportMessage]); scrollToBottom(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; };
  const loadTickets = async () => { const d = await getUserTickets(); setTickets(d); };
  const loadTicketMessages = async (ticketId: string) => {
    const d = await getTicketWithMessages(ticketId);
    if (d) { setMessages(d.messages); setSelectedTicket(ticketId); setView("chat"); await markMessagesAsRead(ticketId); }
  };
  const handleCreateTicket = async () => {
    if (!newTicketData.subject || !newTicketData.message) return;
    setLoading(true);
    const r = await createSupportTicket(newTicketData);
    setLoading(false);
    if (r.ticket) { await loadTickets(); setNewTicketData({ subject: "", message: "", priority: "medium", category: "general" }); setView("list"); }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    const msg = newMessage; setNewMessage("");
    await sendSupportMessage(selectedTicket, msg);
  };
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket, "closed");
    await loadTickets(); setView("list"); setSelectedTicket(null);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const f = "border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-[10px] font-bold text-black block mb-0.5";

  // List view
  if (view === "list") return (
    <div className="flex flex-col h-full bg-[#d4d0c8] text-black select-none">
      <div className="bg-[#000080] px-3 py-1 flex items-center justify-between shrink-0">
        <span className="text-white text-sm font-bold">🎫 Soporte</span>
        <div className="flex gap-1">
          <button onClick={() => setView("new")} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-[10px] font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
            <Plus className="h-3 w-3" /> Nuevo
          </button>
          <button onClick={onClose} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-500">
            <p className="text-xs">Sin tickets de soporte</p>
            <button onClick={() => setView("new")} className="text-xs text-[#000080] underline">Crear tu primer ticket</button>
          </div>
        ) : tickets.map(ticket => (
          <button key={ticket.id} onClick={() => loadTicketMessages(ticket.id)}
            className="w-full border border-[#808080] bg-white hover:bg-[#000080] hover:text-white group text-left px-3 py-2 shadow-[1px_1px_0px_#808080]">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-xs font-bold line-clamp-1 flex-1">{ticket.subject}</span>
              <span className={`text-[10px] font-bold shrink-0 group-hover:text-white ${STATUS_COLORS[ticket.status] ?? ""}`}>{STATUS_LABELS[ticket.status] ?? ticket.status}</span>
            </div>
            <p className="text-[10px] text-gray-500 group-hover:text-gray-300">{fmtDate(ticket.created_at)}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // New ticket form
  if (view === "new") return (
    <div className="flex flex-col h-full bg-[#d4d0c8] text-black select-none">
      <div className="bg-[#000080] px-3 py-1 flex items-center gap-2 shrink-0">
        <button onClick={() => setView("list")} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">←</button>
        <span className="text-white text-sm font-bold">Nuevo Ticket</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div><label className={l}>Asunto</label><input value={newTicketData.subject} onChange={e => setNewTicketData(p => ({ ...p, subject: e.target.value }))} placeholder="Describí brevemente tu problema" className={f} /></div>
        <div>
          <label className={l}>Categoría</label>
          <select value={newTicketData.category} onChange={e => setNewTicketData(p => ({ ...p, category: e.target.value as TicketCategory }))} className={f}>
            <option value="general">General</option>
            <option value="technical">Técnico</option>
            <option value="billing">Facturación</option>
            <option value="feature_request">Solicitud de Función</option>
            <option value="bug">Error/Bug</option>
          </select>
        </div>
        <div>
          <label className={l}>Prioridad</label>
          <select value={newTicketData.priority} onChange={e => setNewTicketData(p => ({ ...p, priority: e.target.value as TicketPriority }))} className={f}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        <div><label className={l}>Mensaje</label><textarea value={newTicketData.message} onChange={e => setNewTicketData(p => ({ ...p, message: e.target.value }))} rows={5} placeholder="Describí tu problema en detalle..." className={f + " resize-none"} /></div>
        <button onClick={handleCreateTicket} disabled={loading || !newTicketData.subject || !newTicketData.message}
          className="w-full border border-[#808080] bg-[#d4d0c8] py-2 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center justify-center gap-1">
          {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Creando...</> : "✔ Crear Ticket"}
        </button>
      </div>
    </div>
  );

  // Chat view
  const currentTicket = tickets.find(t => t.id === selectedTicket);
  return (
    <div className="flex flex-col h-full bg-[#d4d0c8] text-black select-none">
      <div className="bg-[#000080] px-3 py-1 flex items-center gap-2 shrink-0">
        <button onClick={() => { setView("list"); setSelectedTicket(null); }} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">←</button>
        <div className="flex-1 min-w-0">
          <span className="text-white text-xs font-bold truncate block">{currentTicket?.subject}</span>
        </div>
        {currentTicket && <span className={`text-[10px] font-bold bg-white px-1.5 py-0.5 border border-[#808080] ${STATUS_COLORS[currentTicket.status] ?? ""}`}>{STATUS_LABELS[currentTicket.status]}</span>}
      </div>

      {currentTicket?.status === "open" && (
        <div className="px-3 py-1 border-b border-[#808080] bg-[#c0c0c0] shrink-0">
          <button onClick={handleCloseTicket} className="w-full border border-[#808080] bg-[#d4d0c8] py-0.5 text-[10px] font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0]">
            Cerrar Ticket
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.is_staff ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] border-2 px-3 py-2 ${msg.is_staff ? "border-[#808080] bg-[#d4d0c8] text-black" : "border-[#000080] bg-[#000080] text-white"}`}>
              <p className="text-xs whitespace-pre-wrap">{msg.message}</p>
              <p className={`text-[10px] mt-1 ${msg.is_staff ? "text-gray-500" : "text-blue-200"}`}>{fmtDate(msg.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      {currentTicket?.status !== "closed" && (
        <div className="border-t-2 border-[#808080] p-2 bg-[#d4d0c8] shrink-0 flex gap-2">
          <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            placeholder="Escribí tu mensaje..." className="flex-1 border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]" />
          <button onClick={handleSendMessage} disabled={!newMessage.trim()}
            className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
            <Send className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
