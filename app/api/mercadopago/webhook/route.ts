import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaymentById } from "@/lib/mercadopago/client";

// Use service role client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // MercadoPago sends different types of notifications
    const { type, data } = body;

    if (type === "payment") {
      const paymentId = data?.id;
      
      if (!paymentId) {
        return NextResponse.json({ error: "No payment ID" }, { status: 400 });
      }

      // Get payment details from MercadoPago
      const payment = await getPaymentById(paymentId);
      
      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      const paymentStatus = payment.status; // approved, pending, rejected, etc.
      const externalReference = payment.external_reference;

      // Parse external reference: companyId|planId|timestamp
      const [companyId, planId] = externalReference?.split("|") || [];

      if (!companyId || !planId) {
        console.error("Invalid external reference:", externalReference);
        return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
      }

      const { data: plan, error: planError } = await supabaseAdmin
        .from("plans")
        .select("id, price, currency, interval, interval_count")
        .eq("id", planId)
        .single();

      if (planError || !plan) {
        console.error("Plan not found for payment:", planError);
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      const { data: existingPayment, error: existingPaymentError } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("external_reference", externalReference)
        .single();

      if (existingPaymentError && existingPaymentError.code !== "PGRST116") {
        console.error("Error checking existing payment:", existingPaymentError);
      }

      // Update payment record
      const paymentPayload = {
        mp_payment_id: String(paymentId),
        status: mapPaymentStatus(paymentStatus),
        paid_at: paymentStatus === "approved" ? new Date().toISOString() : null,
      };

      let paymentError = null;

      if (existingPayment) {
        const { error } = await supabaseAdmin
          .from("payments")
          .update(paymentPayload)
          .eq("external_reference", externalReference);
        paymentError = error;
      } else {
        const { error } = await supabaseAdmin
          .from("payments")
          .insert({
            company_id: companyId,
            plan_id: plan.id,
            amount: Number(plan.price),
            currency: plan.currency,
            payment_type: "one_time",
            external_reference: externalReference,
            ...paymentPayload,
          });
        paymentError = error;
      }

      if (paymentError) {
        console.error("Error updating payment:", paymentError);
      }

      if (["cancelled", "refunded", "charged_back"].includes(paymentStatus || "")) {
        const { data: existingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .single();

        if (existingSub) {
          const now = new Date().toISOString();
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "cancelled",
              cancel_at_period_end: false,
              current_period_end: now,
              updated_at: now,
            })
            .eq("id", existingSub.id);
        }
      }

      // If payment approved, create or update subscription
      if (paymentStatus === "approved") {
        // Check if subscription exists
        const { data: existingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .single();

        const periodStart = new Date();
        const periodEnd = new Date();
        const intervalCount = Math.max(Number(plan.interval_count) || 1, 1);
        if (plan.interval === "year") {
          periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + intervalCount);
        }

        if (existingSub) {
          // Update existing subscription
          await supabaseAdmin
            .from("subscriptions")
            .update({
              plan_id: planId,
              status: "active",
              mp_subscription_id: paymentId ? String(paymentId) : null,
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingSub.id);

          if (!existingPayment) {
            await supabaseAdmin
              .from("payments")
              .update({ subscription_id: existingSub.id })
              .eq("external_reference", externalReference);
          }
        } else {
          // Create new subscription
          const { data: createdSub } = await supabaseAdmin
            .from("subscriptions")
            .insert({
            company_id: companyId,
            plan_id: planId,
            status: "active",
            mp_subscription_id: paymentId ? String(paymentId) : null,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
            .select("id")
            .single();

          if (createdSub && !existingPayment) {
            await supabaseAdmin
              .from("payments")
              .update({ subscription_id: createdSub.id })
              .eq("external_reference", externalReference);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Also handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

function mapPaymentStatus(mpStatus: string | undefined): string {
  switch (mpStatus) {
    case "approved":
      return "approved";
    case "pending":
    case "in_process":
      return "pending";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "charged_back";
    default:
      return "pending";
  }
}
