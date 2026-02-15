"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarIcon } from "lucide-react"

interface DateRangePresetsProps {
  onSelectPreset: (startDate: Date, endDate: Date) => void
}

export function DateRangePresets({ onSelectPreset }: DateRangePresetsProps) {
  const getToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  const presets = [
    {
      label: "Hoy",
      getValue: () => {
        const today = getToday()
        return { start: today, end: today }
      },
    },
    {
      label: "Esta semana",
      getValue: () => {
        const today = getToday()
        const dayOfWeek = today.getDay()
        const start = new Date(today)
        start.setDate(today.getDate() - dayOfWeek)
        return { start, end: today }
      },
    },
    {
      label: "Este mes",
      getValue: () => {
        const today = getToday()
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        return { start, end: today }
      },
    },
    {
      label: "Este trimestre",
      getValue: () => {
        const today = getToday()
        const quarter = Math.floor(today.getMonth() / 3)
        const start = new Date(today.getFullYear(), quarter * 3, 1)
        return { start, end: today }
      },
    },
    {
      label: "Este año",
      getValue: () => {
        const today = getToday()
        const start = new Date(today.getFullYear(), 0, 1)
        return { start, end: today }
      },
    },
    {
      label: "Últimos 7 días",
      getValue: () => {
        const today = getToday()
        const start = new Date(today)
        start.setDate(today.getDate() - 6)
        return { start, end: today }
      },
    },
    {
      label: "Últimos 30 días",
      getValue: () => {
        const today = getToday()
        const start = new Date(today)
        start.setDate(today.getDate() - 29)
        return { start, end: today }
      },
    },
    {
      label: "Últimos 90 días",
      getValue: () => {
        const today = getToday()
        const start = new Date(today)
        start.setDate(today.getDate() - 89)
        return { start, end: today }
      },
    },
    {
      label: "Mes anterior",
      getValue: () => {
        const today = getToday()
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const end = new Date(today.getFullYear(), today.getMonth(), 0)
        return { start, end }
      },
    },
    {
      label: "Año anterior",
      getValue: () => {
        const today = getToday()
        const start = new Date(today.getFullYear() - 1, 0, 1)
        const end = new Date(today.getFullYear() - 1, 11, 31)
        return { start, end }
      },
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Presets de Fecha
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {presets.map((preset) => (
          <DropdownMenuItem
            key={preset.label}
            onClick={() => {
              const { start, end } = preset.getValue()
              onSelectPreset(start, end)
            }}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
