// Types for Support Chat System

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'general' | 'technical' | 'billing' | 'feature_request' | 'bug';

export interface SupportTicket {
  id: string;
  company_id: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketWithMessages extends SupportTicket {
  messages: SupportMessage[];
  unread_count: number;
}

export interface SupportStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  avg_response_time_hours: number | null;
}
