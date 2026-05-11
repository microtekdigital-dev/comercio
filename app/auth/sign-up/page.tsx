"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("token")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)

    const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        data: { full_name: fullName, company_name: companyName, company_slug: companySlug || `company-${Date.now()}`, invite_token: inviteToken },
      },
    })

    if (error) { setError(error.message); setLoading(false); return }

    try {
      await fetch('/api/welcome-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userName: fullName, companyName: companyName || 'Tu Empresa' })
      })
    } catch {}

    setSuccess(true); setLoading(false)
  }

  const handleGoogleSignUp = async () => {
    setError(null); setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const f = "border border-[#808080] bg-white text-black text-sm px-2 py-1.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
  const l = "text-xs font-bold text-black block mb-0.5"

  if (success) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1.5 flex items-center gap-2">
            <span className="text-white text-sm font-bold">✅ Cuenta Creada</span>
          </div>
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-700 mx-auto" />
            <div>
              <p className="text-sm font-bold">Revisá tu correo</p>
              <p className="text-xs text-gray-600 mt-1">
                Enviamos un enlace de verificación a <strong>{email}</strong>.
                Hacé clic en el enlace para activar tu cuenta.
              </p>
            </div>
            <Link href="/auth/login"
              className="block border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-center">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4 py-8 font-sans">
      <div className="w-full max-w-sm">
        <div className="border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
          {/* Title bar */}
          <div className="bg-[#000080] px-3 py-1.5 flex items-center gap-2">
            <div className="w-4 h-4 bg-[#d4d0c8] border border-[#808080] flex items-center justify-center text-[8px] font-bold">🏢</div>
            <span className="text-white text-sm font-bold flex-1">
              {inviteToken ? "Aceptar Invitación" : "Crear Cuenta — Prueba Gratis 14 días"}
            </span>
          </div>

          <form onSubmit={handleSignUp} className="p-5 space-y-3">
            {/* Logo */}
            <div className="text-center py-3 border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] mb-4">
              <div className="text-3xl mb-1">🏢</div>
              <div className="text-xs font-bold text-[#000080]">Sistema de Gestión</div>
              <div className="text-[10px] text-gray-500">
                {inviteToken ? "Completá tu cuenta para unirte al equipo" : "Sin tarjeta · Sin contratos · Gratis 14 días"}
              </div>
            </div>

            {error && (
              <div className="border-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700 font-bold">⚠ {error}</div>
            )}

            <div>
              <label className={l}>Nombre completo *</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Juan Pérez" disabled={loading} className={f} autoFocus />
            </div>

            <div>
              <label className={l}>Correo electrónico *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nombre@empresa.com" disabled={loading} className={f} />
            </div>

            <div>
              <label className={l}>Contraseña * (mínimo 6 caracteres)</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Creá una contraseña segura" disabled={loading} className={f} />
            </div>

            {!inviteToken && (
              <div>
                <label className={l}>Nombre de la empresa *</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="Mi Comercio S.A." disabled={loading} className={f} />
              </div>
            )}

            <button type="submit" disabled={loading || googleLoading}
              className="w-full border border-[#808080] bg-[#d4d0c8] py-2 text-sm font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta...</> : inviteToken ? "✔ Unirse al equipo" : "✔ Crear cuenta gratis"}
            </button>

            {/* Separator */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-[#808080]" />
              <span className="text-[10px] text-gray-500 font-bold">O</span>
              <div className="flex-1 border-t border-[#808080]" />
            </div>

            <button type="button" onClick={handleGoogleSignUp} disabled={loading || googleLoading}
              className="w-full border border-[#808080] bg-[#d4d0c8] py-2 text-sm font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center justify-center gap-2">
              {googleLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Conectando...</> : <><FcGoogle className="h-4 w-4" /> Continuar con Google</>}
            </button>

            <div className="border-t border-[#808080] pt-3 text-center">
              <span className="text-xs text-gray-600">¿Ya tenés cuenta?{" "}</span>
              <Link href="/auth/login" className="text-xs text-[#000080] underline hover:text-[#0000cc] font-bold">
                Iniciar sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
