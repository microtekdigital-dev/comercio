"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfile } from "@/lib/actions/users"
import { Loader2, CheckCircle2 } from "lucide-react"

interface ProfileSettingsProps {
  user: { id: string; email: string; full_name: string | null; role: string }
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [fullName, setFullName] = useState(user.full_name || "")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setSuccess(false); setLoading(true)
    const result = await updateProfile(fullName)
    if (!result.success) { setError(result.error || "Error al actualizar"); setLoading(false); return }
    setSuccess(true); setLoading(false); router.refresh()
    setTimeout(() => setSuccess(false), 3000)
  }

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
  const l = "text-xs font-bold text-black block mb-0.5"

  return (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-3">
      <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
        <span className="text-xs font-bold">👤 Perfil</span>
      </div>

      {error && <div className="border border-red-400 bg-red-50 px-3 py-2 text-xs text-red-700 font-bold">{error}</div>}
      {success && (
        <div className="border border-green-400 bg-green-50 px-3 py-2 text-xs text-green-700 font-bold flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Perfil actualizado
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={l}>Email</label>
          <input type="email" value={user.email} disabled className={f + " bg-[#f0f0f0] text-gray-500"} />
          <span className="text-[10px] text-gray-500">No se puede cambiar</span>
        </div>
        <div>
          <label className={l}>Nombre Completo</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading} placeholder="Tu nombre" className={f} />
        </div>
        <div>
          <label className={l}>Rol</label>
          <input type="text" value={user.role} disabled className={f + " bg-[#f0f0f0] text-gray-500 capitalize"} />
        </div>
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
            {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  )
}
