"use client"

import { useState, useTransition } from "react"
import { getAuditLogs } from "@/lib/actions/audit-log"
import type { AuditLogEntry, AuditModule, AuditAction, AuditLogFilters } from "@/lib/actions/audit-log"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const MODULES: AuditModule[] = [
  "ventas", "devoluciones", "stock", "compras",
  "pagos", "reparaciones", "caja", "productos",
  "presupuestos", "clientes", "proveedores",
]

const ACTIONS: AuditAction[] = [
  "crear", "modificar", "cancelar", "eliminar",
  "recibir", "abrir", "cerrar", "movimiento",
  "cambio_precio", "pagar", "procesar",
]

const MODULE_COLORS: Record<AuditModule, string> = {
  ventas: "bg-blue-100 text-blue-800",
  devoluciones: "bg-orange-100 text-orange-800",
  stock: "bg-yellow-100 text-yellow-800",
  compras: "bg-purple-100 text-purple-800",
  pagos: "bg-green-100 text-green-800",
  reparaciones: "bg-red-100 text-red-800",
  caja: "bg-teal-100 text-teal-800",
  productos: "bg-indigo-100 text-indigo-800",
  presupuestos: "bg-pink-100 text-pink-800",
  clientes: "bg-cyan-100 text-cyan-800",
  proveedores: "bg-lime-100 text-lime-800",
}

interface Props {
  initialLogs: AuditLogEntry[]
}

export function AuditLogTable({ initialLogs }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialLogs.length === 50)
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  const [filters, setFilters] = useState<{
    module: string
    action: string
    userId: string
    dateFrom: string
    dateTo: string
  }>({ module: "", action: "", userId: "", dateFrom: "", dateTo: "" })

  const fetchLogs = (newFilters: typeof filters, newPage: number) => {
    startTransition(async () => {
      const params: AuditLogFilters = {
        page: newPage,
        pageSize: 50,
        ...(newFilters.module && { module: newFilters.module as AuditModule }),
        ...(newFilters.action && { action: newFilters.action as AuditAction }),
        ...(newFilters.userId && { userId: newFilters.userId }),
        ...(newFilters.dateFrom && { dateFrom: newFilters.dateFrom }),
        ...(newFilters.dateTo && { dateTo: newFilters.dateTo }),
      }
      const result = await getAuditLogs(params)
      setLogs(result)
      setHasMore(result.length === 50)
    })
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setPage(1)
    fetchLogs(newFilters, 1)
  }

  const clearFilters = () => {
    const empty = { module: "", action: "", userId: "", dateFrom: "", dateTo: "" }
    setFilters(empty)
    setPage(1)
    fetchLogs(empty, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchLogs(filters, newPage)
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select
          value={filters.module || "all"}
          onValueChange={(v) => handleFilterChange("module", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los módulos</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.action || "all"}
          onValueChange={(v) => handleFilterChange("action", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a} className="capitalize">{a.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ID de usuario..."
            value={filters.userId}
            onChange={(e) => handleFilterChange("userId", e.target.value)}
            className="pl-8 w-52"
          />
        </div>

        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          className="w-40"
          title="Desde"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          className="w-40"
          title="Hasta"
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Fecha / Hora</TableHead>
              <TableHead className="w-32">Módulo</TableHead>
              <TableHead className="w-32">Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="w-20">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No hay registros para los filtros seleccionados
                </TableCell>
              </TableRow>
            ) : (
              logs.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${MODULE_COLORS[entry.module] ?? "bg-gray-100 text-gray-800"}`}>
                      {entry.module}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {entry.action.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="text-muted-foreground">{entry.entity_type}</span>
                    <span className="ml-1 font-mono text-xs text-muted-foreground/70">
                      #{entry.entity_id.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.user_name ?? (
                      <span className="font-mono text-xs text-muted-foreground">
                        {entry.user_id.slice(0, 8)}...
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.metadata && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Ver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Página {page} · {logs.length} registros
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isPending}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasMore || isPending}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
          {selectedEntry && (
            <>
              <SheetHeader>
                <SheetTitle>Detalle del evento</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Fecha</p>
                    <p>{format(new Date(selectedEntry.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Usuario</p>
                    <p>{selectedEntry.user_name ?? selectedEntry.user_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Módulo</p>
                    <p className="capitalize">{selectedEntry.module}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Acción</p>
                    <p className="capitalize">{selectedEntry.action.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Tipo de entidad</p>
                    <p>{selectedEntry.entity_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">ID de entidad</p>
                    <p className="font-mono text-xs break-all">{selectedEntry.entity_id}</p>
                  </div>
                </div>

                {selectedEntry.metadata && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-2">Metadata</p>
                    <pre className="bg-muted rounded-md p-3 text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedEntry.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
