import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userName, companyName } = body;

    // Validar que se recibieron los datos necesarios
    if (!email || !userName || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields: email, userName, companyName" },
        { status: 400 }
      );
    }

    // Enviar el email de bienvenida
    const result = await sendWelcomeEmail(email, userName, companyName);

    if (!result.success) {
      console.error("[Welcome Email API] Failed to send email:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: result.messageId },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Welcome Email API] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
