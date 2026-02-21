'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
  Printer
} from 'lucide-react'
import { 
  getPendingRepairs,
  getRepairsByTechnician,
  getRepairsByStatus,
  getRepairProfitability,
  getAverageRepairTime,
  getCompletedRepairsForExport,
  type TechnicianRepairStats,
  type StatusDistribution,
  type RepairProfitability
} from '@/lib/actions/repair-reports'
import { 
  exportRepairsToExcel,
  exportRepairsToCSV,
  exportRepairsToPDF,
  printRepairsReport
} from '@/lib/utils/export'
import { createClient } from '@/lib/supabase/client'
import type { RepairOrder } from '@/lib/types/erp'

export default function RepairReportsPage() {
  const [companyId, setCompanyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  // Date range filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Report data
  const [pendingRepairs, setPendingRepairs] = useState<RepairOrder[]>([])
  const [technicianStats, setTechnicianStats] = useState<TechnicianRepairStats[]>([])
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([])
  const [profitability, setProfitability] = useState<RepairProfitability[]>([])
  const [averageTime, setAverageTime] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [companyName, setCompanyName] = useState('Mi Empresa')

  useEffect(() => {
    loadCompanyId()
  }, [])

  useEffect(() => {
    if (companyId) {
      loadReports()
    }
  }, [companyId, dateFrom, dateTo])

  async function loadCompanyId() {
    console.log('[REPORTS] Loading company ID...')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[REPORTS] User:', user?.id)
      
      if (!user) {
        console.error('[REPORTS] No user found')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      console.log('[REPORTS] Profile data:', profile, 'Error:', profileError)

      if (profile?.company_id) {
        console.log('[REPORTS] Company ID found:', profile.company_id)
        setCompanyId(profile.company_id)
        
        // Load company name
        const { data: settings, error: settingsError } = await supabase
          .from('company_settings')
          .select('company_name')
          .eq('company_id', profile.company_id)
          .single()
        
        console.log('[REPORTS] Company settings:', settings, 'Error:', settingsError)
        
        if (settings?.company_name) {
          setCompanyName(settings.company_name)
        }
      } else {
        console.error('[REPORTS] No company_id found in profile')
        setLoading(false)
      }
    } catch (error) {
      console.error('[REPORTS] Error loading company:', error)
      setLoading(false)
    }
  }

  async function loadReports() {
    setLoading(true)
    console.log('[REPORTS] Starting to load reports for company:', companyId)
    
    try {
      const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
      console.log('[REPORTS] Date range:', dateRange)

      // Load reports with individual error handling
      console.log('[REPORTS] Calling all report functions...')
      const [pending, technicians, status, profit, avgTime] = await Promise.allSettled([
        getPendingRepairs(companyId),
        getRepairsByTechnician(companyId, dateRange),
        getRepairsByStatus(companyId),
        getRepairProfitability(companyId, dateRange),
        getAverageRepairTime(companyId, dateRange)
      ])

      console.log('[REPORTS] Results:', {
        pending: pending.status,
        technicians: technicians.status,
        status: status.status,
        profit: profit.status,
        avgTime: avgTime.status
      })

      // Set data with fallbacks
      setPendingRepairs(pending.status === 'fulfilled' ? pending.value : [])
      setTechnicianStats(technicians.status === 'fulfilled' ? technicians.value : [])
      setStatusDistribution(status.status === 'fulfilled' ? status.value : [])
      setProfitability(profit.status === 'fulfilled' ? profit.value : [])
      setAverageTime(avgTime.status === 'fulfilled' ? avgTime.value : 0)

      // Log any errors
      if (pending.status === 'rejected') console.error('Error loading pending repairs:', pending.reason)
      if (technicians.status === 'rejected') console.error('Error loading technician stats:', technicians.reason)
      if (status.status === 'rejected') console.error('Error loading status distribution:', status.reason)
      if (profit.status === 'rejected') console.error('Error loading profitability:', profit.reason)
      if (avgTime.status === 'rejected') console.error('Error loading average time:', avgTime.reason)
      
      console.log('[REPORTS] Data loaded:', {
        pendingCount: pending.status === 'fulfilled' ? pending.value.length : 0,
        technicianCount: technicians.status === 'fulfilled' ? technicians.value.length : 0,
        statusCount: status.status === 'fulfilled' ? status.value.length : 0,
        profitCount: profit.status === 'fulfilled' ? profit.value.length : 0,
        avgTime: avgTime.status === 'fulfilled' ? avgTime.value : 0
      })
    } catch (error) {
      console.error('Error loading reports:', error)
      alert('Error al cargar reportes. Por favor revisa la consola.')
    } finally {
      setLoading(false)
      console.log('[REPORTS] Loading complete')
    }
  }

  function handleClearFilters() {
    setDateFrom('')
    setDateTo('')
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  async function handleExportExcel() {
    if (!companyId) return
    
    setExporting(true)
    try {
      const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
      const repairs = await getCompletedRepairsForExport(companyId, dateRange)
      exportRepairsToExcel(repairs)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Error al exportar a Excel')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPDF() {
    if (!companyId) return
    
    setExporting(true)
    try {
      const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
      const repairs = await getCompletedRepairsForExport(companyId, dateRange)
      exportRepairsToPDF(repairs, companyName)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Error al exportar a PDF')
    } finally {
      setExporting(false)
    }
  }

  async function handlePrint() {
    if (!companyId) return
    
    setExporting(true)
    try {
      const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
      const repairs = await getCompletedRepairsForExport(companyId, dateRange)
      printRepairsReport(repairs, companyName)
    } catch (error) {
      console.error('Error printing report:', error)
      alert('Error al imprimir reporte')
    } finally {
      setExporting(false)
    }
  }

  const totalRevenue = profitability.reduce((sum, r) => sum + r.total_paid, 0)
  const totalProfit = profitability.reduce((sum, r) => sum + r.profit, 0)
  const avgProfitMargin = profitability.length > 0
    ? profitability.reduce((sum, r) => sum + r.profit_margin, 0) / profitability.length
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes de Reparaciones</h1>
        <p className="text-muted-foreground">
          Análisis y estadísticas del módulo de reparaciones
        </p>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Fecha
          </CardTitle>
          <CardDescription>
            Selecciona un rango de fechas para filtrar los reportes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Reparaciones Pendientes
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRepairs.length}</div>
                <p className="text-xs text-muted-foreground">
                  No entregadas ni canceladas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tiempo Promedio
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageTime} días</div>
                <p className="text-xs text-muted-foreground">
                  Desde ingreso hasta entrega
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ingresos Totales
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Reparaciones entregadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Margen Promedio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgProfitMargin.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Rentabilidad promedio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
              <CardDescription>
                Cantidad de reparaciones en cada estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.count} reparaciones
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technician Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Desempeño por Técnico</CardTitle>
              <CardDescription>
                Estadísticas de reparaciones por técnico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Técnico</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Completadas</TableHead>
                    <TableHead className="text-right">En Proceso</TableHead>
                    <TableHead className="text-right">Tiempo Prom.</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicianStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay datos de técnicos
                      </TableCell>
                    </TableRow>
                  ) : (
                    technicianStats.map((tech) => (
                      <TableRow key={tech.technician_id}>
                        <TableCell className="font-medium">{tech.technician_name}</TableCell>
                        <TableCell className="text-right">{tech.total_repairs}</TableCell>
                        <TableCell className="text-right">{tech.completed_repairs}</TableCell>
                        <TableCell className="text-right">{tech.in_progress_repairs}</TableCell>
                        <TableCell className="text-right">{tech.average_repair_days} días</TableCell>
                        <TableCell className="text-right">{formatCurrency(tech.total_revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Profitability */}
          <Card>
            <CardHeader>
              <CardTitle>Rentabilidad por Reparación</CardTitle>
              <CardDescription>
                Análisis de costos y ganancias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Costo Repuestos</TableHead>
                    <TableHead className="text-right">Mano de Obra</TableHead>
                    <TableHead className="text-right">Total Cobrado</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitability.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay datos de rentabilidad
                      </TableCell>
                    </TableRow>
                  ) : (
                    profitability.slice(0, 10).map((item) => (
                      <TableRow key={item.repair_order_id}>
                        <TableCell className="font-medium">#{item.order_number}</TableCell>
                        <TableCell>{item.customer_name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.parts_cost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.labor_cost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total_paid)}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.profit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={item.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.profit_margin.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {profitability.length > 10 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Mostrando las 10 reparaciones más rentables
                </p>
              )}
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Exportar Reportes</CardTitle>
              <CardDescription>
                Descarga o imprime el reporte de reparaciones realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleExportExcel}
                  disabled={exporting || loading}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar a Excel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportPDF}
                  disabled={exporting || loading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar a PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePrint}
                  disabled={exporting || loading}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              </div>
              {exporting && (
                <p className="text-sm text-muted-foreground mt-2">
                  Generando reporte...
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
