"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push("/pos"); router.refresh()
  }

  const handleGoogleLogin = async () => {
    setError(null); setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/pos` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const f = "border border-[#808080] bg-white text-sm px-2 py-1.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
  const l = "text-xs font-bold text-black block mb-0.5"

  return (
    <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Window */}
        <div className="border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
          {/* Title bar */}
          <div className="bg-[#000080] px-3 py-1.5 flex items-center gap-2">
            <div className="w-4 h-4 bg-[#d4d0c8] border border-[#808080] flex items-center justify-center text-[8px] font-bold">🏢</div>
            <span className="text-white text-sm font-bold flex-1">Sistema de Gestión — Iniciar Sesión</span>
          </div>

          <form onSubmit={handleLogin} className="p-5 space-y-4">
            {/* Logo area */}
            <div className="text-center py-3 border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] mb-4">
              <div className="text-3xl mb-1">🏢</div>
              <div className="text-xs font-bold text-[#000080]">Sistema de Gestión</div>
              <div className="text-[10px] text-gray-500">Bienvenido de nuevo</div>
            </div>

            {error && (
              <div className="border-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700 font-bold flex items-center gap-1">
                ⚠ {error}
              </div>
            )}

            <div>
              <label className={l}>Correo electrónico</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nombre@empresa.com" disabled={loading} className={f} autoFocus />
            </div>

            <div>
              <label className={l}>Contraseña</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Ingresá tu contraseña" disabled={loading} className={f} />
            </div>

            <button type="submit" disabled={loading || googleLoading}
              className="w-full border border-[#808080] bg-[#d4d0c8] py-2 text-sm font-bold shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando sesión...</> : "✔ Iniciar Sesión"}
            </button>

            {/* Separator */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-[#808080]" />
              <span className="text-[10px] text-gray-500 font-bold">O</span>
              <div className="flex-1 border-t border-[#808080]" />
            </div>

            <button type="button" onClick={handleGoogleLogin} disabled={loading || googleLoading}
              className="w-full border border-[#808080] bg-[#d4d0c8] py-2 text-sm font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center justify-center gap-2">
              {googleLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Conectando...</> : <><FcGoogle className="h-4 w-4" /> Continuar con Google</>}
            </button>

            {/* Links */}
            <div className="border-t border-[#808080] pt-3 space-y-1 text-center">
              <div>
                <Link href="/auth/forgot-password" className="text-xs text-[#000080] underline hover:text-[#0000cc]">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="text-xs text-gray-600">
                ¿No tenés cuenta?{" "}
                <Link href="/auth/sign-up" className="text-[#000080] underline hover:text-[#0000cc] font-bold">
                  Crear una
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
