import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { canAccessRepairs } from "@/lib/utils/plan-limits"

const BASE_SECTIONS = [
  { href: "/dashboard/sales",           icon: "🛒", label: "Ventas",             desc: "Historial y detalle de ventas" },
  { href: "/dashboard/customers",       icon: "👥", label: "Clientes",           desc: "Gestión de clientes y cuentas" },
  { href: "/dashboard/products",        icon: "📦", label: "Productos",          desc: "Catálogo, stock y precios" },
  { href: "/dashboard/categories",      icon: "🗂",  label: "Categorías",         desc: "Organización de productos" },
  { href: "/dashboard/suppliers",       icon: "🏭", label: "Proveedores",        desc: "Proveedores y cuenta corriente" },
  { href: "/dashboard/purchase-orders", icon: "📋", label: "Órdenes de Compra",  desc: "Compras y recepciones" },
  { href: "/dashboard/quotes",          icon: "📄", label: "Presupuestos",       desc: "Crear y gestionar presupuestos" },
  { href: "/dashboard/cash-register",   icon: "💰", label: "Caja Registradora",  desc: "Aperturas, cierres y movimientos" },
  { href: "/dashboard/analytics",       icon: "📊", label: "Reportes",           desc: "Analítica y estadísticas" },
  { href: "/dashboard/stock-history",   icon: "📈", label: "Historial Stock",    desc: "Movimientos de inventario" },
  { href: "/dashboard/price-history",   icon: "💲", label: "Historial Precios",  desc: "Cambios de precios" },
  { href: "/dashboard/team",            icon: "👤", label: "Equipo",             desc: "Usuarios y permisos" },
  { href: "/dashboard/settings",        icon: "⚙",  label: "Configuración",      desc: "Datos de la empresa" },
  { href: "/dashboard/billing",         icon: "💳", label: "Planes",             desc: "Suscripción y facturación" },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, company_id")
    .eq("id", user.id)
    .single()

  const name = profile?.full_name?.split(" ")[0] ?? "Usuario"
  const isAdmin = profile?.role === "admin"

  // Verificar acceso a reparaciones según plan
  let repairsAllowed = false
  if (profile?.company_id) {
    const access = await canAccessRepairs(profile.company_id)
    repairsAllowed = access.allowed
  }

  const sections = [
    ...BASE_SECTIONS,
    ...(repairsAllowed
      ? [{ href: "/dashboard/repairs", icon: "🔧", label: "Reparaciones", desc: "Órdenes de servicio técnico" }]
      : []),
    ...(isAdmin
      ? [{ href: "/dashboard/admin/support", icon: "🎫", label: "Soporte Admin", desc: "Tickets de soporte" }]
      : []),
  ]

  return (
    <div className="space-y-3 text-black select-none">
      {/* Header */}
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🖥 Panel de Control</span>
          <Link href="/pos" className="text-blue-200 text-xs hover:text-white font-bold">
            ← Volver al POS
          </Link>
        </div>
        <div className="bg-[#d4d0c8] px-4 py-3 border-b border-[#808080]">
          <p className="text-sm font-bold">Bienvenido, {name}</p>
          <p className="text-xs text-gray-600">Seleccioná una sección para continuar</p>
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="border-2 border-[#808080] bg-white shadow-[2px_2px_0px_#808080] hover:bg-[#000080] hover:text-white group p-3 flex flex-col gap-1 transition-none"
          >
            <span className="text-2xl leading-none">{s.icon}</span>
            <span className="text-xs font-bold mt-1">{s.label}</span>
            <span className="text-[10px] text-gray-500 group-hover:text-blue-200 leading-tight">{s.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
