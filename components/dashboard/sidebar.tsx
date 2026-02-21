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

interface SidebarProps {
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
            { href: "/dashboard/quotes", label: "Presupuestos", icon: FileText },
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
            { href: "/dashboard/quotes", label: "Presupuestos", icon: FileText },
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
    <>
      {/* Header */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm truncate max-w-[160px]">
              {user.companies?.name || "My Company"}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {user.role}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Panel link (always first) */}
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Panel
        </Link>

        {/* Sections */}
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider">
              {section.title}
            </h3>
            {section.items.map((item) => renderNavItem(item))}
          </div>
        ))}
      </nav>

      {/* User menu */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(user.full_name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="fixed top-3 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
