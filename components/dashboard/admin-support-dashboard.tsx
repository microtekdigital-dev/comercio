"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTicketWithMessages, updateTicketStatus } from "@/lib/actions/support";
import type { SupportMessage, TicketStatus } from "@/lib/types/support";
import { Send, AlertCircle, User, Building2, Loader2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto", in_progress: "En Progreso", resolved: "Resuelto", closed: "Cerrado",
};
const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-700", in_progress: "text-amber-700", resolved: "text-green-700", closed: "text-gray-500",
};

interface AdminSupportDashboardProps {
  initialTickets: any[];
}

export function AdminSupportDashboard({ initialTickets }: AdminSupportDashboardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase.channel(`admin-ticket-${selectedTicket}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${selectedTicket}` },
        (payload) => { setMessages(prev => [...prev, payload.new as SupportMessage]); scrollToBottom(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const loadTicketMessages = async (ticketId: string) => {
    const data = await getTicketWithMessages(ticketId);
    if (data) { setMessages(data.messages); setSelectedTicket(ticketId); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);
    const message = newMessage;
    setNewMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("support_messages").insert({
        ticket_id: selectedTicket, user_id: user.id, message, is_staff: true,
      });
    }
    setSending(false);
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket, status);
    setTickets((prev: any[]) => prev.map(t => t.id === selectedTicket ? { ...t, status } : t));
  };

  const fmtDate = (d: string) => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const filteredTickets = tickets.filter((t: any) => filter === "all" || t.status === filter);
  const currentTicket = tickets.find((t: any) => t.id === selectedTicket);

  return (
    <div className="flex h-full text-black select-none border-2 border-[#808080] shadow-[2px_2px_0px_#000]">

      {/* Sidebar */}
      <div className="w-80 shrink-0 flex flex-col border-r-2 border-[#808080] bg-[#d4d0c8]">
        {/* Title */}
        <div className="bg-[#000080] px-3 py-1 shrink-0">
          <span className="text-white text-sm font-bold">🎫 Panel de Soporte</span>
        </div>

        {/* Filter */}
        <div className="px-3 py-2 border-b border-[#808080] shrink-0">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="w-full border border-[#808080] bg-white text-xs px-1 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]">
            <option value="all">Todos los Tickets</option>
            <option value="open">Abiertos</option>
            <option value="in_progress">En Progreso</option>
            <option value="resolved">Resueltos</option>
            <option value="closed">Cerrados</option>
          </select>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs text-gray-500">Sin tickets</div>
          ) : filteredTickets.map((ticket: any, idx: number) => (
            <button key={ticket.id} onClick={() => loadTicketMessages(ticket.id)}
              className={`w-full text-left px-3 py-2 border-b border-[#e0e0e0] transition-none
                ${selectedTicket === ticket.id ? "bg-[#000080] text-white" : idx % 2 === 0 ? "bg-white hover:bg-[#000080] hover:text-white" : "bg-[#f5f5f5] hover:bg-[#000080] hover:text-white"}`}>
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xs font-bold line-clamp-1 flex-1">{ticket.subject}</span>
                <span className={`text-[10px] font-bold shrink-0 ${selectedTicket === ticket.id ? "text-blue-200" : STATUS_COLORS[ticket.status] ?? ""}`}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] opacity-70">
                <User className="h-2.5 w-2.5" />
                <span className="truncate">{ticket.user?.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] opacity-70">
                <Building2 className="h-2.5 w-2.5" />
                <span className="truncate">{ticket.company?.name ?? "—"}</span>
              </div>
              <div className="text-[10px] opacity-60 mt-0.5">{fmtDate(ticket.created_at)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[#d4d0c8] min-w-0">
        {selectedTicket && currentTicket ? (
          <>
            {/* Header */}
            <div className="bg-[#000080] px-3 py-1 shrink-0 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-white text-sm font-bold truncate block">{currentTicket.subject}</span>
                <span className="text-blue-200 text-[10px]">
                  {currentTicket.user?.email} · {currentTicket.company?.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold ${STATUS_COLORS[currentTicket.status] ?? "text-white"} bg-white px-2 py-0.5 border border-[#808080]`}>
                  {STATUS_LABELS[currentTicket.status]}
                </span>
                <select value={currentTicket.status} onChange={e => handleStatusChange(e.target.value as TicketStatus)}
                  className="border border-[#808080] bg-[#d4d0c8] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>
            </div>

            {/* Category/priority bar */}
            <div className="flex gap-2 px-3 py-1.5 border-b border-[#808080] bg-[#c0c0c0] shrink-0">
              <span className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-[10px] font-bold capitalize">{currentTicket.category}</span>
              <span className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-[10px] font-bold capitalize">Prioridad: {currentTicket.priority}</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.is_staff ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] border-2 px-3 py-2 ${msg.is_staff
                    ? "border-[#000080] bg-[#000080] text-white"
                    : "border-[#808080] bg-[#d4d0c8] text-black"}`}>
                    <p className="text-xs whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.is_staff ? "text-blue-200" : "text-gray-500"}`}>
                      {msg.is_staff ? "Soporte" : "Usuario"} · {fmtDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            {currentTicket.status !== "closed" && (
              <div className="border-t-2 border-[#808080] p-3 bg-[#d4d0c8] shrink-0 flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Escribí tu respuesta como admin..."
                  className="flex-1 border border-[#808080] bg-white text-xs px-2 py-1.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
                />
                <button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}
                  className="border border-[#808080] bg-[#d4d0c8] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                  {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Enviar
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-500">
            <AlertCircle className="h-10 w-10 opacity-30" />
            <p className="text-xs">Seleccioná un ticket para ver la conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}
