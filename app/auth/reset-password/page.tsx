"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2 } from "lucide-react"

const f = "border border-[#808080] bg-white text-black text-sm px-2 py-1.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
const l = "text-xs font-bold text-black block mb-0.5"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError("El enlace de recuperación es inválido o expiró. Solicitá uno nuevo.")
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), [])
  const handleConfirmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value), [])

  if (success) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1.5">
            <span className="text-white text-sm font-bold">✅ Contraseña actualizada</span>
          </div>
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-700 mx-auto" />
            <div>
              <p className="text-sm font-bold">¡Listo!</p>
              <p className="text-xs text-gray-600 mt-1">Tu contraseña fue cambiada correctamente.</p>
            </div>
            <Link href="/auth/login"
              className="block border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-center">
              ← Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1.5 flex items-center gap-2">
            <div className="w-4 h-4 bg-[#d4d0c8] border border-[#808080] flex items-center justify-center text-[8px] font-bold">🔒</div>
            <span className="text-white text-sm font-bold flex-1">Nueva Contraseña</span>
          </div>

          <form onSubmit={handleUpdate} className="p-5 space-y-4">
            <div className="text-center py-3 border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] mb-2">
              <div className="text-3xl mb-1">🔒</div>
              <div className="text-xs text-gray-600">Elegí una nueva contraseña para tu cuenta</div>
            </div>

            {error && (
              <div className="border-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700 font-bold">⚠ {error}</div>
            )}

            <div>
              <label className={l}>Nueva contraseña</label>
              <input type="password" required minLength={6} value={password} onChange={handlePasswordChange}
                placeholder="Mínimo 6 caracteres" disabled={loading} className={f} autoFocus />
            </div>

            <div>
              <label className={l}>Confirmar contraseña</label>
              <input type="password" required value={confirmPassword} onChange={handleConfirmChange}
                placeholder="Repetí la contraseña" disabled={loading} className={f} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full border border-[#808080] bg-[#d4d0c8] py-2 text-sm font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Actualizando...</> : "✔ Actualizar contraseña"}
            </button>

            <div className="border-t border-[#808080] pt-3 text-center">
              <Link href="/auth/login" className="text-xs text-[#000080] underline hover:text-[#0000cc]">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
