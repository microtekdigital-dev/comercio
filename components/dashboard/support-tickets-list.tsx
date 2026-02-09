"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { SupportTicket } from "@/lib/types/support";

interface SupportTicketsListProps {
  tickets: SupportTicket[];
}

export function SupportTicketsList({ tickets }: SupportTicketsListProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: any; icon: any; label: string; color: string }> = {
      open: {
        variant: "default",
        icon: AlertCircle,
        label: "Abierto",
        color: "text-blue-600",
      },
      in_progress: {
        variant: "secondary",
        icon: Clock,
        label: "En Progreso",
        color: "text-yellow-600",
      },
      resolved: {
        variant: "outline",
        icon: CheckCircle2,
        label: "Resuelto",
        color: "text-green-600",
      },
      closed: {
        variant: "outline",
        icon: CheckCircle2,
        label: "Cerrado",
        color: "text-gray-600",
      },
    };

    return configs[status] || configs.open;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      low: { variant: "outline", label: "Baja" },
      medium: { variant: "secondary", label: "Media" },
      high: { variant: "default", label: "Alta" },
      urgent: { variant: "destructive", label: "Urgente" },
    };

    const config = variants[priority] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tienes tickets de soporte</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea tu primer ticket para obtener ayuda
          </p>
          <Link href="/dashboard/support/new">
            <Button>Crear Ticket</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const statusConfig = getStatusConfig(ticket.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="block"
              >
                <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{ticket.subject}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Creado: {formatDate(ticket.created_at)}</span>
                        <span>•</span>
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusConfig.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
