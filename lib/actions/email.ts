"use server";

import { createClient } from "@/lib/supabase/server";
import type { Sale } from "@/lib/types/erp";

interface SendInvoiceEmailParams {
  saleId: string;
  recipientEmail: string;
}

export async function sendInvoiceEmail({ saleId, recipientEmail }: SendInvoiceEmailParams) {
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
      return { error: "No se encontró la empresa" };
    }

    // Get sale details
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(*),
        items:sale_items(*, product:products(*))
      `)
      .eq("id", saleId)
      .eq("company_id", profile.company_id)
      .single();

    if (saleError || !sale) {
      return { error: "Venta no encontrada" };
    }

    // TODO: Implement actual email sending
    // For now, we'll just simulate it
    // You can integrate with services like:
    // - Resend (https://resend.com)
    // - SendGrid
    // - AWS SES
    // - Nodemailer
    
    console.log("Sending invoice email to:", recipientEmail);
    console.log("Sale:", sale.sale_number);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { 
      success: true,
      message: `Factura enviada a ${recipientEmail}` 
    };
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return { error: "Error al enviar el email" };
  }
}
