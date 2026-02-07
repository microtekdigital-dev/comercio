"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, CreditCard, AlertCircle } from "lucide-react";
import type { SubscriptionSummary } from "@/lib/actions/plans";

interface CurrentSubscriptionProps {
  subscription: SubscriptionSummary | null;
}

export function CurrentSubscription({ subscription }: CurrentSubscriptionProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suscripción Actual
          </CardTitle>
          <CardDescription>
            No tienes una suscripción activa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecciona un plan para comenzar a disfrutar de todas las funcionalidades.
          </p>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription.plan;
  const isTrial = subscription.isTrial;
  const isActive = subscription.status === "activado";
  const willCancel = subscription.cancel_at_period_end;
  const statusLabel =
    subscription.status === "activado"
      ? isTrial
        ? "Trial activo"
        : "Activado"
      : subscription.status;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error(result.error || "Error al cancelar la suscripción");
      } else {
        router.refresh();
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suscripción Actual
          </CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>
            {statusLabel}
          </Badge>
        </div>
        {plan && (
          <CardDescription>
            Plan {plan.name}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {plan && (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">
              {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: plan.currency,
                minimumFractionDigits: 0,
              }).format(plan.price)}
            </span>
            <span className="text-muted-foreground">
              /{plan.interval === "month" ? "mes" : "año"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Período actual: {formatDate(subscription.current_period_start)} -{" "}
            {formatDate(subscription.current_period_end)}
          </span>
        </div>

        {willCancel && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>
              Tu suscripción se cancelará al final del período actual
            </span>
          </div>
        )}

        {isActive && !willCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full bg-transparent">
                Cancelar Suscripción
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                <AlertDialogDescription>
                  La cancelación es inmediata. Perderás acceso al plan en el
                  momento de confirmar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Mantener Suscripción</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelando..." : "Confirmar Cancelación"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
