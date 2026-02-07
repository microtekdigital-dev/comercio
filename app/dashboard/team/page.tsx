import { redirect } from "next/navigation"
import { getCurrentUser, getTeamMembers } from "@/lib/actions/users"
import { TeamMembersList } from "@/components/dashboard/team-members-list"

export default async function TeamPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const teamMembers = await getTeamMembers()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your team members
        </p>
      </div>

      <TeamMembersList members={teamMembers} currentUserId={user.id} />
    </div>
  )
}
