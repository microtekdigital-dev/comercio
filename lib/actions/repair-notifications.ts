'use server'

import { Resend } from "resend";
import { getRepairOrderById } from "./repair-orders";
import { formatCurrency, formatDate } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

/**
 * Send notification when repair is ready for pickup
 * @param repairOrderId - Repair order ID
 * @param companyInfo - Company information
 * @returns Success status and message ID
 */
export async function sendRepairReadyNotification(
  repairOrderId: string,
  companyInfo?: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }
) {
  try {
    // Verify API key is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_dummy_key_for_build") {
      console.warn("[Resend] API key not configured. Email will not be sent.");
      return { 
        success: false, 
        error: "Resend API key not configured. Please add RESEND_API_KEY to your environment variables." 
      };
    }

    // Get repair order details
    const order = await getRepairOrderById(repairOrderId);
    if (!order) {
      return { success: false, error: "Orden de reparación no encontrada" };
    }

    // Check if customer has email
    if (!order.customer.email) {
      return { success: false, error: "El cliente no tiene email registrado" };
    }

    const companyName = companyInfo?.name || "Servicio Técnico";
    const companyPhone = companyInfo?.phone || "";
    const companyEmail = companyInfo?.email || "";
    const companyAddress = companyInfo?.address || "";

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: order.customer.email,
      subject: `✅ Su reparación está lista - Orden #${order.order_number}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reparación Lista</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ ¡Su reparación está lista!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Orden #${order.order_number}</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Estimado/a ${order.customer.name},</p>
              
              <p style="font-size: 16px; margin-bottom: 30px;">
                Nos complace informarle que su <strong>${order.device_type} ${order.brand} ${order.model}</strong> ha sido reparado exitosamente y está listo para ser retirado.
              </p>

              <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">
                  ✅ Reparación Completada
                </p>
                <p style="margin: 10px 0 0 0; color: #065f46; font-size: 14px;">
                  Su dispositivo está listo para ser retirado en nuestro local.
                </p>
              </div>

              <h2 style="color: #1f2937; margin-top: 30px; margin-bottom: 15px; font-size: 20px;">
                Detalles de la Reparación
              </h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: 600; color: #6b7280; width: 40%;">Orden N°:</td>
                  <td style="padding: 12px 0; color: #1f2937;">#${order.order_number}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Dispositivo:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${order.device_type} ${order.brand} ${order.model}</td>
                </tr>
                ${order.serial_number ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Serie:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${order.serial_number}</td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Fecha Ingreso:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${formatDate(order.received_date)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Fecha Reparación:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${order.repair_completed_date ? formatDate(order.repair_completed_date) : 'Hoy'}</td>
                </tr>
                ${order.technician ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Técnico:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${order.technician.name}</td>
                </tr>
                ` : ''}
              </table>

              ${order.diagnosis ? `
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Diagnóstico:</h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${order.diagnosis}</p>
              </div>
              ` : ''}

              ${order.total_cost > 0 ? `
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6b7280; font-size: 14px;">Total:</span>
                  <span style="font-weight: 600; color: #1f2937; font-size: 16px;">${formatCurrency(order.total_cost)}</span>
                </div>
                ${order.total_paid > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6b7280; font-size: 14px;">Pagado:</span>
                  <span style="font-weight: 600; color: #10b981; font-size: 16px;">${formatCurrency(order.total_paid)}</span>
                </div>
                ` : ''}
                ${order.balance > 0 ? `
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                  <span style="font-weight: 600; color: #1f2937; font-size: 16px;">Saldo Pendiente:</span>
                  <span style="font-weight: 700; color: #ef4444; font-size: 18px;">${formatCurrency(order.balance)}</span>
                </div>
                ` : `
                <div style="background: #d1fae5; padding: 10px; border-radius: 4px; margin-top: 10px;">
                  <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600; text-align: center;">
                    ✅ Pago Completo
                  </p>
                </div>
                `}
              </div>
              ` : ''}

              <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #92400e;">
                  📍 Información para el Retiro
                </h3>
                ${companyAddress ? `
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">
                  <strong>Dirección:</strong> ${companyAddress}
                </p>
                ` : ''}
                ${companyPhone ? `
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">
                  <strong>Teléfono:</strong> ${companyPhone}
                </p>
                ` : ''}
                ${companyEmail ? `
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Email:</strong> ${companyEmail}
                </p>
                ` : ''}
                <p style="margin: 15px 0 0 0; color: #92400e; font-size: 14px;">
                  Por favor, traiga este email o el número de orden al momento del retiro.
                </p>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Gracias por confiar en nuestro servicio técnico. Esperamos que su dispositivo funcione perfectamente.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Saludos cordiales,<br/>
                <strong>${companyName}</strong>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>Este email fue enviado por ${companyName}</p>
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} Todos los derechos reservados</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending repair ready notification:", error);
      return { success: false, error: error.message };
    }

    console.log("[Resend] Repair ready notification sent successfully:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Resend] Exception sending repair ready notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
}

/**
 * Resend notification for a repair order
 * @param repairOrderId - Repair order ID
 * @param companyInfo - Company information
 * @returns Success status and message ID
 */
export async function resendNotification(
  repairOrderId: string,
  companyInfo?: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }
) {
  // Simply call the main notification function
  return sendRepairReadyNotification(repairOrderId, companyInfo);
}
