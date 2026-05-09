"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateMemberRole, removeMember } from "@/lib/actions/users"
import { Shield, User, UserMinus, Loader2, Users } from "lucide-react"

interface Member {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface TeamMembersListProps {
  members: Member[]
  currentUserId: string
}

export function TeamMembersList({ members, currentUserId }: TeamMembersListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const router = useRouter()

  const handleRoleChange = async (memberId: string, newRole: "admin" | "employee") => {
    setLoading(memberId)
    const result = await updateMemberRole(memberId, newRole)
    if (!result.success) alert(result.error)
    router.refresh()
    setLoading(null)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return
    setLoading(memberToRemove.id)
    const result = await removeMember(memberToRemove.id)
    if (!result.success) alert(result.error)
    setMemberToRemove(null)
    router.refresh()
    setLoading(null)
  }

  const getInitials = (name: string | null, email: string) =>
    name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : email.slice(0, 2).toUpperCase()

  return (
    <>
      {/* Table */}
      <div className="border border-[#808080] bg-white overflow-x-auto">
        <div className="grid grid-cols-[40px_1fr_1fr_100px_120px] border-b-2 border-[#808080] bg-[#d4d0c8]">
          {["", "Nombre", "Email", "Rol", "Acciones"].map((h, i) => (
            <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
          ))}
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-500">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-xs">Sin miembros en el equipo</p>
          </div>
        ) : members.map((member, idx) => (
          <div key={member.id} className={`grid grid-cols-[40px_1fr_1fr_100px_120px] border-b border-[#e0e0e0] text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
            {/* Avatar */}
            <div className="px-2 py-2 border-r border-[#e0e0e0] flex items-center justify-center">
              <div className="w-6 h-6 bg-[#000080] text-white flex items-center justify-center text-[10px] font-bold border border-[#808080]">
                {getInitials(member.full_name, member.email)}
              </div>
            </div>
            {/* Nombre */}
            <div className="px-2 py-2 text-xs border-r border-[#e0e0e0]">
              <span className="font-semibold">{member.full_name || member.email}</span>
              {member.id === currentUserId && <span className="ml-1 text-gray-500">(vos)</span>}
            </div>
            {/* Email */}
            <div className="px-2 py-2 text-xs border-r border-[#e0e0e0] truncate text-gray-600">{member.email}</div>
            {/* Rol */}
            <div className="px-2 py-2 text-xs border-r border-[#e0e0e0]">
              <span className={`flex items-center gap-1 font-bold ${member.role === "admin" ? "text-[#000080]" : "text-gray-600"}`}>
                {member.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {member.role === "admin" ? "Admin" : "Empleado"}
              </span>
            </div>
            {/* Acciones */}
            <div className="px-2 py-2 text-xs flex items-center gap-1">
              {member.id !== currentUserId && (
                loading === member.id ? (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                ) : (
                  <>
                    <button
                      onClick={() => handleRoleChange(member.id, member.role === "admin" ? "employee" : "admin")}
                      title={member.role === "admin" ? "Hacer empleado" : "Hacer admin"}
                      className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-[10px] font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0]"
                    >
                      {member.role === "admin" ? "→ Empleado" : "→ Admin"}
                    </button>
                    <button
                      onClick={() => setMemberToRemove(member)}
                      title="Eliminar del equipo"
                      className="border border-[#808080] bg-[#d4d0c8] px-1.5 py-0.5 text-[10px] font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] text-red-700"
                    >
                      <UserMinus className="h-3 w-3" />
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm remove dialog */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-sm">
            <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
              <span className="text-white text-sm font-bold">⚠ Confirmar</span>
              <button onClick={() => setMemberToRemove(null)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-bold">¿Eliminar del equipo?</p>
              <p className="text-xs text-gray-600">
                ¿Estás seguro de eliminar a <strong>{memberToRemove.full_name || memberToRemove.email}</strong>? Perderá acceso a todos los recursos de la empresa.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#808080]">
                <button onClick={() => setMemberToRemove(null)} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</button>
                <button onClick={handleRemoveMember} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-red-700">✕ Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
