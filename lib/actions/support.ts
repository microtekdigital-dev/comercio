"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  SupportTicket,
  SupportMessage,
  SupportTicketWithMessages,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  SupportStats,
} from "@/lib/types/support";

// Create a new support ticket
export async function createSupportTicket(data: {
  subject: string;
  message: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa del usuario" };
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        subject: data.subject,
        priority: data.priority || "medium",
        category: data.category || "general",
        status: "open",
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Create first message
    const { error: messageError } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        message: data.message,
        is_staff: false,
      });

    if (messageError) throw messageError;

    return { ticket };
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return { error: "Error al crear el ticket de soporte" };
  }
}

// Get all tickets for current user
export async function getUserTickets(): Promise<SupportTicket[]> {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return [];
  }
}

// Get ticket with messages
export async function getTicketWithMessages(
  ticketId: string
): Promise<SupportTicketWithMessages | null> {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError) throw ticketError;

    const { data: messages, error: messagesError } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    const unreadCount = messages?.filter(
      (m) => !m.is_read && m.user_id !== user.id
    ).length || 0;

    return {
      ...ticket,
      messages: messages || [],
      unread_count: unreadCount,
    };
  } catch (error) {
    console.error("Error fetching ticket with messages:", error);
    return null;
  }
}

// Send a message in a ticket
export async function sendSupportMessage(ticketId: string, message: string) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data, error } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        message,
        is_staff: false,
      })
      .select()
      .single();

    if (error) throw error;
    return { message: data };
  } catch (error) {
    console.error("Error sending support message:", error);
    return { error: "Error al enviar el mensaje" };
  }
}

// Mark messages as read
export async function markMessagesAsRead(ticketId: string) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("ticket_id", ticketId)
      .neq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return { error: "Error al marcar mensajes como leídos" };
  }
}

// Update ticket status
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
) {
  const supabase = await createClient();

  try {
    const updates: any = { status };

    if (status === "resolved") {
      updates.resolved_at = new Date().toISOString();
    } else if (status === "closed") {
      updates.closed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;
    return { ticket: data };
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return { error: "Error al actualizar el estado del ticket" };
  }
}

// Get support statistics
export async function getSupportStats(): Promise<SupportStats | null> {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return null;

    const { data, error } = await supabase.rpc("get_support_stats", {
      p_company_id: profile.company_id,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching support stats:", error);
    return null;
  }
}

// Get unread message count
export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("user_id", user.id);

    if (!tickets || tickets.length === 0) return 0;

    const ticketIds = tickets.map((t) => t.id);

    const { count, error } = await supabase
      .from("support_messages")
      .select("*", { count: "exact", head: true })
      .in("ticket_id", ticketIds)
      .neq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    return 0;
  }
}
