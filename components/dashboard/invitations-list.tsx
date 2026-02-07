"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { revokeInvitation } from "@/lib/actions/invitations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react"

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

interface InvitationsListProps {
  invitations: Invitation[]
}

export function InvitationsList({ invitations }: InvitationsListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleRevoke = async (id: string) => {
    setLoading(id)
    const result = await revokeInvitation(id)
    if (!result.success) {
      alert(result.error)
    }
    router.refresh()
    setLoading(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "accepted":
        return <CheckCircle2 className="h-3 w-3" />
      case "expired":
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "secondary"
      case "accepted":
        return "default"
      case "expired":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation History</CardTitle>
        <CardDescription>
          {invitations.length} invitation{invitations.length !== 1 ? "s" : ""} sent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="space-y-1">
                <p className="font-medium text-sm">{invitation.email}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{invitation.role}</span>
                  <span>·</span>
                  <span>Sent {formatDate(invitation.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(invitation.status)} className="capitalize">
                  {getStatusIcon(invitation.status)}
                  <span className="ml-1">{invitation.status}</span>
                </Badge>
                {invitation.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevoke(invitation.id)}
                    disabled={loading === invitation.id}
                  >
                    {loading === invitation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {invitations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No invitations sent yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
