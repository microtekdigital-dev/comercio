"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getUserTickets,
  getTicketWithMessages,
  createSupportTicket,
  sendSupportMessage,
  markMessagesAsRead,
  updateTicketStatus,
} from "@/lib/actions/support";
import type { SupportTicket, SupportMessage, TicketCategory, TicketPriority } from "@/lib/types/support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  // New ticket form
  const [newTicketData, setNewTicketData] = useState({
    subject: "",
    message: "",
    priority: "medium" as TicketPriority,
    category: "general" as TicketCategory,
  });

  // Load tickets
  useEffect(() => {
    loadTickets();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`ticket-${selectedTicket}`)
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

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadTickets = async () => {
    const data = await getUserTickets();
    setTickets(data);
  };

  const loadTicketMessages = async (ticketId: string) => {
    const data = await getTicketWithMessages(ticketId);
    if (data) {
      setMessages(data.messages);
      setSelectedTicket(ticketId);
      setView("chat");
      await markMessagesAsRead(ticketId);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketData.subject || !newTicketData.message) return;

    setLoading(true);
    const result = await createSupportTicket(newTicketData);
    setLoading(false);

    if (result.ticket) {
      await loadTickets();
      setNewTicketData({
        subject: "",
        message: "",
        priority: "medium",
        category: "general",
      });
      setView("list");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const message = newMessage;
    setNewMessage("");

    await sendSupportMessage(selectedTicket, message);
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket, "closed");
    await loadTickets();
    setView("list");
    setSelectedTicket(null);
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

  // Render ticket list
  if (view === "list") {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Soporte</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setView("new")}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Ticket
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tienes tickets de soporte</p>
              <Button
                variant="link"
                onClick={() => setView("new")}
                className="mt-2"
              >
                Crear tu primer ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => loadTicketMessages(ticket.id)}
                  className="w-full p-3 border rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {ticket.subject}
                    </h4>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(ticket.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Render new ticket form
  if (view === "new") {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView("list")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">Nuevo Ticket</h3>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Asunto</label>
              <Input
                value={newTicketData.subject}
                onChange={(e) =>
                  setNewTicketData({ ...newTicketData, subject: e.target.value })
                }
                placeholder="Describe brevemente tu problema"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Categoría</label>
              <Select
                value={newTicketData.category}
                onValueChange={(value: TicketCategory) =>
                  setNewTicketData({ ...newTicketData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Técnico</SelectItem>
                  <SelectItem value="billing">Facturación</SelectItem>
                  <SelectItem value="feature_request">Solicitud de Función</SelectItem>
                  <SelectItem value="bug">Error/Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Prioridad</label>
              <Select
                value={newTicketData.priority}
                onValueChange={(value: TicketPriority) =>
                  setNewTicketData({ ...newTicketData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Mensaje</label>
              <Textarea
                value={newTicketData.message}
                onChange={(e) =>
                  setNewTicketData({ ...newTicketData, message: e.target.value })
                }
                placeholder="Describe tu problema en detalle..."
                rows={6}
              />
            </div>

            <Button
              onClick={handleCreateTicket}
              disabled={loading || !newTicketData.subject || !newTicketData.message}
              className="w-full"
            >
              {loading ? "Creando..." : "Crear Ticket"}
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Render chat view
  const currentTicket = tickets.find((t) => t.id === selectedTicket);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setView("list");
              setSelectedTicket(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold text-sm line-clamp-1">
              {currentTicket?.subject}
            </h3>
          </div>
          {currentTicket && getStatusBadge(currentTicket.status)}
        </div>
        {currentTicket?.status === "open" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCloseTicket}
            className="w-full"
          >
            Cerrar Ticket
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.is_staff ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.is_staff
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    message.is_staff
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70"
                  )}
                >
                  {formatDate(message.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {currentTicket?.status !== "closed" && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Escribe tu mensaje..."
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
