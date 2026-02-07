import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCompanySubscriptionAndPlans, getCompanyPayments } from "@/lib/actions/plans";
import { PlansList } from "@/components/dashboard/plans-list";
import { CurrentSubscription } from "@/components/dashboard/current-subscription";
import { PaymentHistory } from "@/components/dashboard/payment-history";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface BillingPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/auth/login");
  }

  // Get user's company from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.company_id) {
    redirect("/dashboard");
  }

  // Fetch data in parallel
  const [billingSummary, payments] = await Promise.all([
    getCompanySubscriptionAndPlans(),
    getCompanyPayments(profile.company_id),
  ]);

  const { plans, subscription, hasUsedTrial } = billingSummary;

  const isAdmin = ["owner", "admin"].includes(profile.role || "");
  const paymentStatus = params.status;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Facturación</h2>
        <p className="text-muted-foreground">
          Gestiona tu suscripción y métodos de pago
        </p>
      </div>

      {/* Payment Status Messages */}
      {paymentStatus === "success" && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Pago exitoso
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Tu pago ha sido procesado correctamente. Tu suscripción está activa.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === "failure" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Pago fallido</AlertTitle>
          <AlertDescription>
            Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === "pending" && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Pago pendiente
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Tu pago está siendo procesado. Te notificaremos cuando se complete.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      <CurrentSubscription subscription={subscription} />

      {/* Plans Section */}
      {isAdmin ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Planes Disponibles</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona el plan que mejor se adapte a tus necesidades
            </p>
          </div>
          <Suspense fallback={<PlansSkeleton />}>
            <PlansList plans={plans} hasUsedTrial={hasUsedTrial} />
          </Suspense>
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            Solo los administradores pueden cambiar el plan de suscripción.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment History */}
      <PaymentHistory payments={payments} />
    </div>
  );
}

function PlansSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[400px] w-full" />
      ))}
    </div>
  );
}
