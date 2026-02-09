"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTicketWithMessages, sendSupportMessage, updateTicketStatus } from "@/lib/actions/support";
import type { SupportMessage, TicketStatus } from "@/lib/types/support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle2, Clock, AlertCircle, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSupportDashboardProps {
  initialTickets: any[];
}

export function AdminSupportDashboard({ initialTickets }: AdminSupportDashboardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Subscribe to realtime updates
  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`admin-ticket-${selectedTicket}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${selectedTicket}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    const data = await getTicketWithMessages(ticketId);
    if (data) {
      setMessages(data.messages);
      setSelectedTicket(ticketId);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const message = newMessage;
    setNewMessage("");

    // Admin messages are marked as staff
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("support_messages").insert({
        ticket_id: selectedTicket,
        user_id: user.id,
        message,
        is_staff: true, // Mark as staff message
      });
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket, status);
    
    // Update local state
    setTickets(tickets.map(t => 
      t.id === selectedTicket ? { ...t, status } : t
    ));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      open: { variant: "default", icon: AlertCircle, label: "Abierto" },
      in_progress: { variant: "secondary", icon: Clock, label: "En Progreso" },
      resolved: { variant: "outline", icon: CheckCircle2, label: "Resuelto" },
      closed: { variant: "outline", icon: CheckCircle2, label: "Cerrado" },
    };

    const config = variants[status] || variants.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTickets = tickets.filter(t => 
    filter === "all" || t.status === filter
  );

  const currentTicket = tickets.find(t => t.id === selectedTicket);

  return (
    <div className="flex h-full">
      {/* Sidebar - Lista de Tickets */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-4">Panel de Soporte Admin</h2>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Tickets</SelectItem>
              <SelectItem value="open">Abiertos</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
              <SelectItem value="closed">Cerrados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => loadTicketMessages(ticket.id)}
                className={cn(
                  "w-full p-3 border rounded-lg text-left transition-colors",
                  selectedTicket === ticket.id
                    ? "bg-accent border-primary"
                    : "hover:bg-accent"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {ticket.subject}
                  </h4>
                  {getStatusBadge(ticket.status)}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="h-3 w-3" />
                  <span>{ticket.user?.email || "Usuario"}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Building2 className="h-3 w-3" />
                  <span>{ticket.company?.name || "Empresa"}</span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {formatDate(ticket.created_at)}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedTicket && currentTicket ? (
          <>
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {currentTicket.subject}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {currentTicket.user?.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {currentTicket.company?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(currentTicket.status)}
                  <Select
                    value={currentTicket.status}
                    onValueChange={(v: TicketStatus) => handleStatusChange(v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierto</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 text-xs">
                <Badge variant="outline" className="capitalize">
                  {currentTicket.category}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  Prioridad: {currentTicket.priority}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.is_staff ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        message.is_staff
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.is_staff
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {message.is_staff ? "Tú" : "Usuario"} • {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            {currentTicket.status !== "closed" && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Escribe tu respuesta como admin..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona un ticket para ver la conversación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
