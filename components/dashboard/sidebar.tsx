"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import type { FeaturePermission } from "@/lib/types/plans"
import {
  Building2,
  LayoutDashboard,
  Users,
  Settings,
  Mail,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  CreditCard,
  Package,
  ShoppingCart,
  FolderTree,
  BarChart3,
  ClipboardList,
  Menu,
  FileText,
  DollarSign,
  History,
  TrendingUp,
  PackageSearch,
  Scale,
  Wallet,
  Lock,
  Wrench,
  FileBarChart,
  Monitor,
  RotateCcw,
  ShieldCheck,
  Globe,
} from "lucide-react"

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
  companies: {
    id: string
    name: string
    slug: string
  } | null
}

export interface SidebarProps {
  user: Profile
  permissions: {
    purchaseOrders: FeaturePermission
    suppliers: FeaturePermission
    stockHistory: FeaturePermission
    priceHistory: FeaturePermission
    cashRegister: FeaturePermission
    inventoryLiquidation: FeaturePermission
    accountsSettlement: FeaturePermission
    repairs: FeaturePermission
  }
}

interface NavSection {
  title: string
  items: NavItemWithPermission[]
}

interface NavItem {
  href: string
  label: string
  icon: any
}

interface NavItemWithPermission extends NavItem {
  permission?: FeaturePermission
}

const adminNavItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/suppliers", label: "Proveedores", icon: Building2 },
  { href: "/dashboard/purchase-orders", label: "Órdenes de Compra", icon: ClipboardList },
  { href: "/dashboard/products", label: "Productos", icon: Package },
  { href: "/dashboard/categories", label: "Categorías", icon: FolderTree },
  { href: "/dashboard/stock-history", label: "Historial de Stock", icon: History },
  { href: "/dashboard/price-history", label: "Historial de Precios", icon: TrendingUp },
  { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/quotes", label: "Presupuestos", icon: FileText },
  { href: "/dashboard/repairs", label: "Reparaciones", icon: Wrench },
  { href: "/dashboard/cash-register", label: "Apertura/Cierre Caja", icon: DollarSign },
  { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3 },
  { href: "/dashboard/inventory-report", label: "Liquidación de Inventario", icon: PackageSearch },
  { href: "/dashboard/accounts-settlement", label: "Liquidación de Cuentas", icon: Scale },
  { href: "/dashboard/team", label: "Equipo", icon: Users },
  { href: "/dashboard/invitations", label: "Invitaciones", icon: Mail },
  { href: "/dashboard/billing", label: "Planes", icon: CreditCard },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
]

const employeeNavItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/products", label: "Productos", icon: Package },
  { href: "/dashboard/categories", label: "Categorías", icon: FolderTree },
  { href: "/dashboard/stock-history", label: "Historial de Stock", icon: History },
  { href: "/dashboard/price-history", label: "Historial de Precios", icon: TrendingUp },
  { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/quotes", label: "Presupuestos", icon: FileText },
  { href: "/dashboard/repairs", label: "Reparaciones", icon: Wrench },
  { href: "/dashboard/cash-register", label: "Apertura/Cierre Caja", icon: DollarSign },
  { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3 },
  { href: "/dashboard/inventory-report", label: "Liquidación de Inventario", icon: PackageSearch },
  { href: "/dashboard/accounts-settlement", label: "Liquidación de Cuentas", icon: Scale },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
]

export function DashboardSidebar({ user, permissions }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Función para manejar clicks en funcionalidades bloqueadas
  const handleLockedFeatureClick = (permission: FeaturePermission) => {
    toast.error(permission.message || "Esta funcionalidad no está disponible en tu plan actual", {
      description: "Actualiza tu plan para acceder a esta funcionalidad",
      action: {
        label: "Ver Planes",
        onClick: () => router.push("/dashboard/billing"),
      },
    })
  }

  // Función para renderizar items de navegación (bloqueados o accesibles)
  const renderNavItem = (item: NavItemWithPermission) => {
    const Icon = item.icon
    const isActive = pathname === item.href || 
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
    const isLocked = item.permission && !item.permission.allowed

    if (isLocked && item.permission) {
      // Renderizar como bloqueado
      return (
        <button
          key={item.href}
          onClick={() => handleLockedFeatureClick(item.permission!)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full text-left",
            "text-muted-foreground hover:bg-muted/50 cursor-not-allowed opacity-60"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.label}</span>
          <span className="text-xs flex items-center gap-1">
            <Lock className="h-3 w-3" />
            {item.permission.requiredPlan}
          </span>
        </button>
      )
    }

    // Renderizar como accesible
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    )
  }

  // Usar useMemo para evitar problemas de hidratación
  const navSections = useMemo((): NavSection[] => {
    if (user.role === "admin") {
      return [
        {
          title: "VENTAS",
          items: [
            { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
            { href: "/pos", label: "Punto de Venta", icon: Monitor },
            { href: "/dashboard/quotes", label: "Presupuestos", icon: FileText },
            { href: "/dashboard/returns", label: "Devoluciones", icon: RotateCcw },
            { href: "/dashboard/customers", label: "Clientes", icon: Users },
            { href: "/dashboard/catalogo", label: "Catálogo Online", icon: Globe },
          ],
        },
        {
          title: "REPARACIONES",
          items: [
            { href: "/dashboard/repairs", label: "Reparaciones", icon: Wrench, permission: permissions.repairs },
            { href: "/dashboard/repairs/reports", label: "Historial de Reparaciones", icon: FileBarChart, permission: permissions.repairs },
            { href: "/dashboard/technicians", label: "Técnicos", icon: Users, permission: permissions.repairs },
          ],
        },
        {
          title: "COMPRAS",
          items: [
            { href: "/dashboard/purchase-orders", label: "Órdenes de Compra", icon: ClipboardList, permission: permissions.purchaseOrders },
            { href: "/dashboard/suppliers", label: "Proveedores", icon: Building2, permission: permissions.suppliers },
          ],
        },
        {
          title: "INVENTARIO",
          items: [
            { href: "/dashboard/products", label: "Productos", icon: Package },
            { href: "/dashboard/categories", label: "Categorías", icon: FolderTree },
            { href: "/dashboard/stock-history", label: "Historial de Stock", icon: History, permission: permissions.stockHistory },
            { href: "/dashboard/price-history", label: "Historial de Precios", icon: TrendingUp, permission: permissions.priceHistory },
            { href: "/dashboard/inventory-report", label: "Liquidación de Inventario", icon: PackageSearch, permission: permissions.inventoryLiquidation },
          ],
        },
        {
          title: "CAJA Y FINANZAS",
          items: [
            { href: "/dashboard/cash-register", label: "Apertura / Cierre de Caja", icon: DollarSign, permission: permissions.cashRegister },
            { href: "/dashboard/accounts-settlement", label: "Liquidación de Cuentas", icon: Scale, permission: permissions.accountsSettlement },
            { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3 },
          ],
        },
        {
          title: "EQUIPO",
          items: [
            { href: "/dashboard/team", label: "Equipo", icon: Users },
            { href: "/dashboard/invitations", label: "Invitaciones", icon: Mail },
          ],
        },
        {
          title: "SISTEMA",
          items: [
            { href: "/dashboard/billing", label: "Planes", icon: CreditCard },
            { href: "/dashboard/settings", label: "Configuración", icon: Settings },
            { href: "/dashboard/audit-log", label: "Log de Auditoría", icon: ShieldCheck },
          ],
        },
      ]
    } else {
      // Employee sections
      return [
        {
          title: "VENTAS",
          items: [
            { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
            { href: "/pos", label: "Punto de Venta", icon: Monitor },
            { href: "/dashboard/quotes", label: "Presupuestos", icon: FileText },
            { href: "/dashboard/returns", label: "Devoluciones", icon: RotateCcw },
            { href: "/dashboard/customers", label: "Clientes", icon: Users },
          ],
        },
        {
          title: "REPARACIONES",
          items: [
            { href: "/dashboard/repairs", label: "Reparaciones", icon: Wrench, permission: permissions.repairs },
            { href: "/dashboard/repairs/reports", label: "Historial de Reparaciones", icon: FileBarChart, permission: permissions.repairs },
            { href: "/dashboard/technicians", label: "Técnicos", icon: Users, permission: permissions.repairs },
          ],
        },
        {
          title: "INVENTARIO",
          items: [
            { href: "/dashboard/products", label: "Productos", icon: Package },
            { href: "/dashboard/categories", label: "Categorías", icon: FolderTree },
            { href: "/dashboard/stock-history", label: "Historial de Stock", icon: History, permission: permissions.stockHistory },
            { href: "/dashboard/price-history", label: "Historial de Precios", icon: TrendingUp, permission: permissions.priceHistory },
            { href: "/dashboard/inventory-report", label: "Liquidación de Inventario", icon: PackageSearch, permission: permissions.inventoryLiquidation },
          ],
        },
        {
          title: "CAJA Y FINANZAS",
          items: [
            { href: "/dashboard/cash-register", label: "Apertura / Cierre de Caja", icon: DollarSign, permission: permissions.cashRegister },
            { href: "/dashboard/accounts-settlement", label: "Liquidación de Cuentas", icon: Scale, permission: permissions.accountsSettlement },
            { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3 },
          ],
        },
        {
          title: "SISTEMA",
          items: [
            { href: "/dashboard/settings", label: "Configuración", icon: Settings },
          ],
        },
      ]
    }
  }, [user.role, permissions])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#d4d0c8] border-r-2 border-[#808080]">

      {/* Title bar */}
      <div className="bg-[#000080] px-3 py-1.5 shrink-0">
        <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-white shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate leading-tight">
                {user.companies?.name || "Mi Empresa"}
              </p>
              <p className="text-blue-200 text-[10px] capitalize">{user.role}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Panel */}
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          title="Panel"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium w-full transition-none",
            collapsed ? "justify-center" : "",
            pathname === "/dashboard"
              ? "bg-[#000080] text-white"
              : "text-black hover:bg-[#000080] hover:text-white"
          )}
        >
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Panel</span>}
        </Link>

        {/* Sections */}
        {navSections.map((section) => {
          const visibleItems = section.items.filter(item =>
            !item.permission || item.permission.allowed
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title} className="mt-2">
              {!collapsed && (
                <div className="px-3 py-0.5 text-[10px] font-bold text-[#000080] bg-[#c0c0c0] border-y border-[#808080] tracking-wider">
                  {section.title}
                </div>
              )}
              {collapsed && <div className="border-t border-[#808080] my-1" />}
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                const isLocked = item.permission && !item.permission.allowed

                if (isLocked && item.permission) {
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleLockedFeatureClick(item.permission!)}
                      title={item.label}
                      className={cn("flex items-center gap-2 px-3 py-1.5 text-xs w-full text-left text-gray-400 cursor-not-allowed", collapsed ? "justify-center" : "")}
                    >
                      <Lock className="h-3 w-3 shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    title={item.label}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-xs font-medium w-full transition-none",
                      collapsed ? "justify-center" : "",
                      isActive
                        ? "bg-[#000080] text-white"
                        : "text-black hover:bg-[#000080] hover:text-white"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t-2 border-[#808080] p-2 shrink-0 bg-[#c0c0c0]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn("flex items-center gap-2 w-full px-2 py-1 hover:bg-[#000080] hover:text-white group transition-none text-left", collapsed ? "justify-center" : "")}>
              <div className="w-6 h-6 bg-[#000080] text-white flex items-center justify-center text-[10px] font-bold shrink-0 border border-[#808080]">
                {getInitials(user.full_name, user.email)}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-black group-hover:text-white">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-[10px] text-gray-600 group-hover:text-blue-200 truncate">
                      {user.email}
                    </p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-600 group-hover:text-white shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#d4d0c8] border-2 border-[#808080] shadow-[2px_2px_0px_#000] rounded-none p-0">
            <DropdownMenuItem asChild className="rounded-none text-xs px-3 py-1.5 hover:bg-[#000080] hover:text-white focus:bg-[#000080] focus:text-white cursor-pointer">
              <Link href="/dashboard/settings">
                <User className="mr-2 h-3 w-3" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <div className="border-t border-[#808080]" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="rounded-none text-xs px-3 py-1.5 text-red-700 hover:bg-[#000080] hover:text-white focus:bg-[#000080] focus:text-white cursor-pointer"
            >
              <LogOut className="mr-2 h-3 w-3" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn("hidden md:flex flex-col shrink-0 relative transition-all duration-200", collapsed ? "w-12" : "w-52")}
        suppressHydrationWarning
      >
        <SidebarContent />
        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 z-10 w-6 h-6 bg-[#d4d0c8] border-2 border-[#808080] shadow-[1px_1px_0px_#000] flex items-center justify-center hover:bg-[#c0c0c0]"
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3 text-black" />
            : <ChevronLeft className="h-3 w-3 text-black" />
          }
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <button className="fixed top-2 left-2 z-40 w-8 h-8 bg-[#000080] text-white flex items-center justify-center border border-[#808080] shadow-[2px_2px_0px_#000]">
            <Menu className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-52 bg-[#d4d0c8] border-r-0">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
