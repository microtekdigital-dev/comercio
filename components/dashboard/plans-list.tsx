"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Loader2, Sparkles } from "lucide-react";
import type { Plan, PlanWithActive } from "@/lib/actions/plans";

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  onSelectPlan: (planId: string) => Promise<void>;
  isLoading?: boolean;
  isTrialBlocked?: boolean;
}

export function PlanCard({
  plan,
  isCurrentPlan = false,
  onSelectPlan,
  isLoading = false,
  isTrialBlocked = false,
}: PlanCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    if (isCurrentPlan || isTrialBlocked || loading || isLoading) return;
    setLoading(true);
    try {
      await onSelectPlan(plan.id);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const features = Array.isArray(plan.features) ? plan.features : [];
  const isAnnual = plan.interval === "year";
  const isTrial = plan.name?.toLowerCase().includes("trial") || Number(plan.price) === 0;

  return (
    <Card
      className={`relative flex flex-col ${
        isCurrentPlan
          ? "border-primary ring-2 ring-primary"
          : "border-border hover:border-primary/50"
      } transition-all`}
    >
      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
          Plan Actual
        </Badge>
      )}
      
      {isAnnual && !isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600" variant="default">
          <Sparkles className="h-3 w-3 mr-1" />
          Ahorra 2 meses
        </Badge>
      )}

      {isTrial && !isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600" variant="default">
          <Sparkles className="h-3 w-3 mr-1" />
          Gratis
        </Badge>
      )}
      
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="min-h-[40px]">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-4xl font-bold">
            {formatPrice(plan.price, plan.currency)}
          </span>
          <span className="text-muted-foreground">
            /{plan.interval === "month" ? "mes" : "año"}
          </span>
          {isAnnual && (
            <div className="text-sm text-green-600 font-medium mt-1">
              Equivalente a 10 meses
            </div>
          )}
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          variant={isCurrentPlan ? "secondary" : "default"}
          disabled={isCurrentPlan || isTrialBlocked || loading || isLoading}
          onClick={handleSelect}
        >
          {loading || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : isCurrentPlan ? (
            "Plan Actual"
          ) : isTrialBlocked ? (
            "Trial no disponible"
          ) : isTrial ? (
            "Comenzar Trial Gratis"
          ) : (
            "Seleccionar Plan"
          )}
        </Button>
        {isTrialBlocked && (
          <p className="text-xs text-destructive text-center">
            El trial ya fue utilizado.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

interface PlansListProps {
  plans: PlanWithActive[];
  hasUsedTrial?: boolean;
}

export function PlansList({ plans, hasUsedTrial = false }: PlansListProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  const handleSelectPlan = async (planId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el pago");
      }

      // Redirect to MercadoPago checkout
      const checkoutUrl = data.initPoint || data.sandboxInitPoint;
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("No se pudo obtener la URL de pago");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
      setIsLoading(false);
    }
  };

  // Separar planes por tipo
  const trialPlans = plans.filter(p => p.name?.toLowerCase().includes("trial") || Number(p.price) === 0);
  const monthlyPlans = plans.filter(p => p.interval === "month" && !p.name?.toLowerCase().includes("trial") && Number(p.price) > 0);
  const yearlyPlans = plans.filter(p => p.interval === "year");

  const displayPlans = billingInterval === "month" ? monthlyPlans : yearlyPlans;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Trial Plans - Always show first if available */}
      {trialPlans.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Comienza Gratis</h3>
            <p className="text-muted-foreground">Prueba todas las funciones sin compromiso</p>
          </div>
          <div className="grid gap-6 justify-center md:grid-cols-1 lg:grid-cols-1 max-w-md mx-auto">
            {trialPlans.map((plan) => {
              const isTrialBlocked = hasUsedTrial;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={plan.isActivePlan}
                  onSelectPlan={handleSelectPlan}
                  isLoading={isLoading}
                  isTrialBlocked={isTrialBlocked}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Paid Plans with Monthly/Yearly Toggle */}
      {(monthlyPlans.length > 0 || yearlyPlans.length > 0) && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Elige tu Plan</h3>
            <p className="text-muted-foreground">Ahorra hasta 2 meses con el pago anual</p>
          </div>

          <Tabs value={billingInterval} onValueChange={(v) => setBillingInterval(v as "month" | "year")} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="month">Mensual</TabsTrigger>
              <TabsTrigger value="year" className="relative">
                Anual
                <Badge className="ml-2 bg-green-600 text-xs" variant="default">
                  -17%
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="month" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {monthlyPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={plan.isActivePlan}
                    onSelectPlan={handleSelectPlan}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="year" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {yearlyPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={plan.isActivePlan}
                    onSelectPlan={handleSelectPlan}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
