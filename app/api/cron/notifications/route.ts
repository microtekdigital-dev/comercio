import { NextResponse } from "next/server";
import { runNotificationChecks } from "@/lib/actions/notifications";

// Este endpoint debe ser llamado por un cron job (ej: cada hora)
// Puedes usar servicios como Vercel Cron, GitHub Actions, o cron-job.org
export async function GET(request: Request) {
  // Verificar token de seguridad (opcional pero recomendado)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runNotificationChecks();
    return NextResponse.json({ 
      success: true, 
      message: "Notification checks completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error running notification checks:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to run notification checks" 
    }, { status: 500 });
  }
}
