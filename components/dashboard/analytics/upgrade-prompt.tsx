"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface UpgradePromptProps {
  currentPlan: string;
  requiredPlan: string;
  featureName: string;
  message: string;
}

export function UpgradePrompt({
  currentPlan,
  requiredPlan,
  featureName,
  message,
}: UpgradePromptProps) {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{featureName}</h3>
        
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="text-sm">
            Plan Actual: {currentPlan}
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="default" className="text-sm">
            Requiere: {requiredPlan}
          </Badge>
        </div>
        
        <p className="text-muted-foreground mb-6 max-w-md text-sm md:text-base">
          {message}
        </p>
        
        <Button size="lg" className="w-full sm:w-auto">
          Actualizar Plan
        </Button>
      </CardContent>
    </Card>
  );
}
