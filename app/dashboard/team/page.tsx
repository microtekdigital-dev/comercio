import { redirect } from "next/navigation"
import { getCurrentUser, getTeamMembers } from "@/lib/actions/users"
import { TeamMembersList } from "@/components/dashboard/team-members-list"

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") redirect("/pos")

  const teamMembers = await getTeamMembers()

  return (
    <div className="space-y-3 text-black">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">👤 Equipo ({teamMembers.length} miembros)</span>
        </div>
        <div className="bg-[#d4d0c8] p-3">
          <TeamMembersList members={teamMembers} currentUserId={user.id} />
        </div>
      </div>
    </div>
  )
}
