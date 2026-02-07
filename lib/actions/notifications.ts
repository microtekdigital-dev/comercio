"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type NotificationType = 'low_stock' | 'pending_payment' | 'new_sale' | 'payment_received' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  company_id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  priority: NotificationPriority;
  created_at: string;
  read_at: string | null;
  metadata: any;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  company_id: string;
  low_stock_enabled: boolean;
  pending_payment_enabled: boolean;
  new_sale_enabled: boolean;
  payment_received_enabled: boolean;
  system_enabled: boolean;
  email_notifications: boolean;
}

// Get all notifications for current user's company
export async function getNotifications(limit: number = 50, unreadOnly: boolean = false) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

// Get unread notification count
export async function getUnreadCount() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return 0;

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) throw error;
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error };
  }
}

// Mark all notifications as read
export async function markAllAsRead() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { success: false };

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("company_id", profile.company_id)
      .eq("is_read", false);

    if (error) throw error;
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking all as read:", error);
    return { success: false, error };
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error };
  }
}

// Create notification (for system use)
export async function createNotification(
  companyId: string,
  type: NotificationType,
  title: string,
  message: string,
  options?: {
    userId?: string;
    link?: string;
    priority?: NotificationPriority;
    metadata?: any;
  }
) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        company_id: companyId,
        user_id: options?.userId || null,
        type,
        title,
        message,
        link: options?.link || null,
        priority: options?.priority || 'normal',
        metadata: options?.metadata || null,
      })
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

// Get notification preferences
export async function getNotificationPreferences() {
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

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // Return default preferences if none exist
    if (!data) {
      return {
        low_stock_enabled: true,
        pending_payment_enabled: true,
        new_sale_enabled: true,
        payment_received_enabled: true,
        system_enabled: true,
        email_notifications: false,
      };
    }
    
    return data as NotificationPreferences;
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return null;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { success: false };

    // Try to update first
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("notification_preferences")
        .update(preferences)
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Insert if doesn't exist
      const { error } = await supabase
        .from("notification_preferences")
        .insert({
          user_id: user.id,
          company_id: profile.company_id,
          ...preferences,
        });

      if (error) throw error;
    }
    
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error };
  }
}

// Run notification checks (to be called periodically or on specific events)
export async function runNotificationChecks() {
  const supabase = await createClient();
  
  try {
    // Run low stock check
    await supabase.rpc('check_low_stock_notifications');
    
    // Run pending payment check
    await supabase.rpc('check_pending_payment_notifications');
    
    return { success: true };
  } catch (error) {
    console.error("Error running notification checks:", error);
    return { success: false, error };
  }
}
