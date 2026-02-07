"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Package, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PlanUsageProps {
  usage: {
    planName: string;
    users: {
      current: number;
      max: number;
      percentage: number;
      remaining: number;
    };
    products: {
      current: number;
      max: number;
      percentage: number;
      remaining: number;
    };
    features: string[];
  };
}

export function PlanUsage({ usage }: PlanUsageProps) {
  const isUserLimitNear = usage.users.percentage >= 80;
  const isProductLimitNear = usage.products.percentage >= 80;
  const hasWarning = isUserLimitNear || isProductLimitNear;

  return (
    <Card className={hasWarning ? "border-orange-500" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Uso del Plan</CardTitle>
            <CardDescription>
              Plan {usage.planName}
            </CardDescription>
          </div>
          <Badge variant={hasWarning ? "destructive" : "secondary"}>
            {usage.planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usuarios */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Usuarios</span>
            </div>
            <span className="text-muted-foreground">
              {usage.users.current} / {usage.users.max === 999999 ? "∞" : usage.users.max}
            </span>
          </div>
          {usage.users.max !== 999999 && (
            <>
              <Progress 
                value={usage.users.percentage} 
                className={isUserLimitNear ? "bg-orange-100" : ""}
              />
              {isUserLimitNear && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Solo quedan {usage.users.remaining} usuario{usage.users.remaining !== 1 ? "s" : ""} disponible{usage.users.remaining !== 1 ? "s" : ""}
                </p>
              )}
            </>
          )}
        </div>

        {/* Productos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Productos</span>
            </div>
            <span className="text-muted-foreground">
              {usage.products.current} / {usage.products.max === 999999 ? "∞" : usage.products.max}
            </span>
          </div>
          {usage.products.max !== 999999 && (
            <>
              <Progress 
                value={usage.products.percentage} 
                className={isProductLimitNear ? "bg-orange-100" : ""}
              />
              {isProductLimitNear && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Solo quedan {usage.products.remaining} producto{usage.products.remaining !== 1 ? "s" : ""} disponible{usage.products.remaining !== 1 ? "s" : ""}
                </p>
              )}
            </>
          )}
        </div>

        {/* Botón de upgrade si está cerca del límite */}
        {hasWarning && usage.planName !== "Empresarial" && (
          <Button asChild className="w-full" variant="default">
            <Link href="/dashboard/billing">
              <TrendingUp className="h-4 w-4 mr-2" />
              Actualizar Plan
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
