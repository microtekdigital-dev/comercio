"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  X,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "onboarding_tutorial_completed"

const steps = [
  {
    title: "¡Bienvenido a tu ERP!",
    description:
      "Este sistema te permite gestionar ventas, inventario, caja, reparaciones y mucho más desde un solo lugar. Te guiamos en los primeros pasos.",
    icon: GraduationCap,
    color: "text-primary",
    action: null,
  },
  {
    title: "1. Configurá tu empresa",
    description:
      "Antes de empezar, completá los datos de tu empresa: nombre, dirección, moneda y otros ajustes desde Configuración.",
    icon: Settings,
    color: "text-blue-500",
    action: { label: "Ir a Configuración", href: "/dashboard/settings" },
  },
  {
    title: "2. Cargá tus productos",
    description:
      "Agregá los productos o servicios que vendés. Podés crear categorías, definir precios y controlar el stock desde Productos.",
    icon: Package,
    color: "text-green-500",
    action: { label: "Ir a Productos", href: "/dashboard/products" },
  },
  {
    title: "3. Registrá tu primera venta",
    description:
      "Una vez que tenés productos, podés registrar ventas manualmente o usar el Punto de Venta (POS) para una experiencia más rápida.",
    icon: ShoppingCart,
    color: "text-orange-500",
    action: { label: "Nueva Venta", href: "/dashboard/sales/new" },
  },
  {
    title: "4. Abrí la caja",
    description:
      "Antes de operar cada día, abrí la caja con el monto inicial. Al cerrar el turno, el sistema calcula automáticamente el resumen del día.",
    icon: DollarSign,
    color: "text-yellow-500",
    action: { label: "Ir a Caja", href: "/dashboard/cash-register" },
  },
  {
    title: "5. Revisá los reportes",
    description:
      "Desde Reportes podés ver ventas, ingresos, stock y más. También tenés liquidación de inventario y cuentas para un análisis completo.",
    icon: BarChart3,
    color: "text-purple-500",
    action: { label: "Ver Reportes", href: "/dashboard/analytics" },
  },
]

interface OnboardingTutorialProps {
  open: boolean
  onClose: () => void
}

export function OnboardingTutorial({ open, onClose }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0)

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    onClose()
  }

  const handleNext = () => {
    if (isLast) {
      handleClose()
    } else {
      setStep((s) => s + 1)
    }
  }

  // Reset step when reopened
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Tutorial de inicio
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center gap-4 py-4">
          {/* Icon */}
          <div className={cn("rounded-full bg-muted p-4", current.color)}>
            <Icon className="h-10 w-10" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          {/* Action button */}
          {current.action && (
            <Button variant="outline" size="sm" asChild>
              <a href={current.action.href}>{current.action.label}</a>
            </Button>
          )}

          {/* Step indicators */}
          <div className="flex gap-1.5 mt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <Button size="sm" onClick={handleNext}>
            {isLast ? "Finalizar" : "Siguiente"}
            {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook para controlar el tutorial
export function useTutorial() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      // Pequeño delay para no interferir con la carga inicial
      const t = setTimeout(() => setOpen(true), 1000)
      return () => clearTimeout(t)
    }
  }, [])

  return {
    open,
    openTutorial: () => setOpen(true),
    closeTutorial: () => setOpen(false),
  }
}
