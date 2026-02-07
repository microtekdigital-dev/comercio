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
import { Check, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isTrialPlan = plan.name?.toLowerCase().includes("trial") || Number(plan.price) === 0;
          const isTrialBlocked = isTrialPlan && hasUsedTrial;

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
  );
}
