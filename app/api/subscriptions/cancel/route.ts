import { NextRequest, NextResponse } from "next/server";
import { cancelSubscription } from "@/lib/actions/subscriptions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "ID de suscripción requerido" },
        { status: 400 }
      );
    }

    const result = await cancelSubscription(subscriptionId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in cancel subscription API:", error);
    return NextResponse.json(
      { error: "Error al cancelar la suscripción" },
      { status: 500 }
    );
  }
}
