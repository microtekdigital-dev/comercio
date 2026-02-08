"use server";

import { Resend } from "resend";

// Inicializar Resend con la API key (o una key dummy si no está configurada)
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

/**
 * Envía un email de invitación a un empleado
 */
export async function sendInvitationEmail(
  to: string,
  inviteLink: string,
  companyName: string,
  invitedBy: string,
  role: "admin" | "employee"
) {
  try {
    // Verificar que la API key esté configurada
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_dummy_key_for_build") {
      console.warn("[Resend] API key not configured. Email will not be sent.");
      return { 
        success: false, 
        error: "Resend API key not configured. Please add RESEND_API_KEY to your environment variables." 
      };
    }

    const roleText = role === "admin" ? "Administrador" : "Empleado";
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to,
      subject: `Invitación para unirte a ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitación a ${companyName}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">¡Has sido invitado!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hola,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                <strong>${invitedBy}</strong> te ha invitado a unirte a <strong>${companyName}</strong> como <strong>${roleText}</strong>.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 30px;">
                Haz clic en el botón de abajo para aceptar la invitación y crear tu cuenta:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600; 
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Aceptar Invitación
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                O copia y pega este enlace en tu navegador:
              </p>
              <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
                ${inviteLink}
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Esta invitación expira en 7 días.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Si no esperabas esta invitación, puedes ignorar este email.
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
      console.error("[Resend] Error sending invitation email:", error);
      return { success: false, error: error.message };
    }

    console.log("[Resend] Invitation email sent successfully:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Resend] Exception sending invitation email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
}
