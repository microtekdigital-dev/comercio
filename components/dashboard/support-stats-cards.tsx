"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { SupportStats } from "@/lib/types/support";

interface SupportStatsCardsProps {
  stats: SupportStats;
}

export function SupportStatsCards({ stats }: SupportStatsCardsProps) {
  const cards = [
    {
      title: "Total de Tickets",
      value: stats.total_tickets,
      icon: MessageCircle,
      description: "Todos los tickets creados",
    },
    {
      title: "Tickets Abiertos",
      value: stats.open_tickets,
      icon: Clock,
      description: "Esperando respuesta",
    },
    {
      title: "En Progreso",
      value: stats.in_progress_tickets,
      icon: Clock,
      description: "Siendo atendidos",
    },
    {
      title: "Resueltos",
      value: stats.resolved_tickets + stats.closed_tickets,
      icon: CheckCircle2,
      description: "Tickets completados",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
