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
import { useState } from "react"
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
  canSeePurchaseOrders?: boolean
  canSeeSuppliers?: boolean
}

const adminNavItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/suppliers", label: "Proveedores", icon: Building2 },
  { href: "/dashboard/purchase-orders", label: "Órdenes de Compra", icon: ClipboardList },
  { href: "/dashboard/products", label: "Productos", icon: Package },
  { href: "/dashboard/categories", label: "Categorías", icon: FolderTree },
  { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3 },
  { href: "/dashboard/team", label: "Equipo", icon: Users },
  { href: "/dashboard/invitations", label: "Invitaciones", icon: Mail },
  { href: "/dashboard/billing", label: "Facturación", icon: CreditCard },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
]

const employeeNavItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/products", label: "Productos", icon: Package },
  { href: "/dashboard/categories", label: "Categorías", icon: FolderTree },
  { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
]

export function DashboardSidebar({ user, canSeePurchaseOrders = true, canSeeSuppliers = true }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  // Filtrar items del menú según permisos del plan
  const baseAdminNavItems = [
    { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
    { href: "/dashboard/customers", label: "Clientes", icon: Users },
    ...(canSeeSuppliers ? [{ href: "/dashboard/suppliers", label: "Proveedores", icon: Building2 }] : []),
    ...(canSeePurchaseOrders ? [{ href: "/dashboard/purchase-orders", label: "Órdenes de Compra", icon: ClipboardList }] : []),
    { href: "/dashboard/products", label: "Productos", icon: Package },
    { href: "/dashboard/categories", label: "Categorías", icon: FolderTree },
    { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
    { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3 },
    { href: "/dashboard/team", label: "Equipo", icon: Users },
    { href: "/dashboard/invitations", label: "Invitaciones", icon: Mail },
    { href: "/dashboard/billing", label: "Facturación", icon: CreditCard },
    { href: "/dashboard/settings", label: "Configuración", icon: Settings },
  ]

  const navItems = user.role === "admin" ? baseAdminNavItems : employeeNavItems

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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

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
        })}
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
