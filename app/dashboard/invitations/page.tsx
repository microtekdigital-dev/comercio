import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { getInvitations } from "@/lib/actions/invitations"
import { InvitationForm } from "@/components/dashboard/invitation-form"
import { InvitationsList } from "@/components/dashboard/invitations-list"

export default async function InvitationsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const invitations = await getInvitations()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Invitations</h1>
        <p className="text-muted-foreground mt-1">
          Invite new team members to join your organization
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <InvitationForm />
        <InvitationsList invitations={invitations} />
      </div>
    </div>
  )
}
