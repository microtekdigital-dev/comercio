'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  FileSpreadsheet, FileText, Calendar, TrendingUp, Clock,
  DollarSign, AlertCircle, Printer, Loader2
} from 'lucide-react'
import { 
  getPendingRepairs, getRepairsByTechnician, getRepairsByStatus,
  getRepairProfitability, getAverageRepairTime, getCompletedRepairsForExport,
  type TechnicianRepairStats, type StatusDistribution, type RepairProfitability
} from '@/lib/actions/repair-reports'
import { 
  exportRepairsToExcel, exportRepairsToPDF, printRepairsReport
} from '@/lib/utils/export'
import { createClient } from '@/lib/supabase/client'
import type { RepairOrder } from '@/lib/types/erp'
import Link from 'next/link'

// ── helpers ──────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3">
      <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
        <span className="text-xs font-bold">{title}</span>
      </div>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="border-2 border-[#808080] bg-white p-2 shadow-[inset_1px_1px_2px_#808080]">
      <div className="flex items-center gap-1 text-gray-500 mb-1">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <div className="text-base font-bold font-mono">{value}</div>
      {sub && <div className="text-[10px] text-gray-500">{sub}</div>}
    </div>
  )
}

const f = "border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
const l = "text-xs font-bold text-black block mb-0.5"

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', in_progress: 'En Proceso', waiting_parts: 'Esperando Repuestos',
  ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
}

export default function RepairReportsPage() {
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pendingRepairs, setPendingRepairs] = useState<RepairOrder[]>([])
  const [technicianStats, setTechnicianStats] = useState<TechnicianRepairStats[]>([])
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([])
  const [profitability, setProfitability] = useState<RepairProfitability[]>([])
  const [averageTime, setAverageTime] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [companyName, setCompanyName] = useState('Mi Empresa')

  const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

  useEffect(() => { loadCompanyId() }, [])
  useEffect(() => { if (companyId) loadReports() }, [companyId, dateFrom, dateTo])

  async function loadCompanyId() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (profile?.company_id) {
        setCompanyId(profile.company_id)
        const { data: settings } = await supabase.from('company_settings').select('company_name').eq('company_id', profile.company_id).single()
        if (settings?.company_name) setCompanyName(settings.company_name)
      } else { setLoading(false) }
    } catch { setLoading(false) }
  }

  async function loadReports() {
    setLoading(true)
    try {
      const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
      const [pending, technicians, status, profit, avgTime] = await Promise.allSettled([
        getPendingRepairs(companyId),
        getRepairsByTechnician(companyId, dateRange),
        getRepairsByStatus(companyId),
        getRepairProfitability(companyId, dateRange),
        getAverageRepairTime(companyId, dateRange),
      ])
      setPendingRepairs(pending.status === 'fulfilled' ? pending.value : [])
      setTechnicianStats(technicians.status === 'fulfilled' ? technicians.value : [])
      setStatusDistribution(status.status === 'fulfilled' ? status.value : [])
      setProfitability(profit.status === 'fulfilled' ? profit.value : [])
      setAverageTime(avgTime.status === 'fulfilled' ? avgTime.value : 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value), [])
  const handleDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value), [])
  const clearFilters = useCallback(() => { setDateFrom(''); setDateTo('') }, [])

  async function handleExport(type: 'excel' | 'pdf' | 'print') {
    if (!companyId) return
    setExporting(true)
    try {
      const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
      const repairs = await getCompletedRepairsForExport(companyId, dateRange)
      if (type === 'excel') exportRepairsToExcel(repairs)
      else if (type === 'pdf') exportRepairsToPDF(repairs, companyName)
      else printRepairsReport(repairs, companyName)
    } catch (e) { console.error(e) }
    finally { setExporting(false) }
  }

  const totalRevenue = profitability.reduce((s, r) => s + r.total_paid, 0)
  const avgProfitMargin = profitability.length > 0
    ? profitability.reduce((s, r) => s + r.profit_margin, 0) / profitability.length : 0

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🔧 Reportes de Reparaciones</span>
          <Link href="/dashboard/repairs" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <div className="bg-[#d4d0c8] p-3 space-y-3">

          {/* Filtros */}
          <Section title="Filtros de Fecha">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className={l}>Desde</label>
                <input type="date" value={dateFrom} onChange={handleDateFromChange} className={f} />
              </div>
              <div>
                <label className={l}>Hasta</label>
                <input type="date" value={dateTo} onChange={handleDateToChange} className={f} />
              </div>
              <button onClick={clearFilters} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0]">
                Limpiar
              </button>
            </div>
          </Section>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando reportes...
            </div>
          ) : (
            <>
              {/* Métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard icon={<AlertCircle className="h-3 w-3" />} label="Pendientes" value={String(pendingRepairs.length)} sub="No entregadas" />
                <StatCard icon={<Clock className="h-3 w-3" />} label="Tiempo Promedio" value={`${averageTime} días`} sub="Ingreso → Entrega" />
                <StatCard icon={<DollarSign className="h-3 w-3" />} label="Ingresos Totales" value={fmt(totalRevenue)} sub="Entregadas" />
                <StatCard icon={<TrendingUp className="h-3 w-3" />} label="Margen Promedio" value={`${avgProfitMargin.toFixed(1)}%`} sub="Rentabilidad" />
              </div>

              {/* Distribución por estado */}
              <Section title="Distribución por Estado">
                {statusDistribution.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">Sin datos</p>
                ) : (
                  <div className="space-y-1">
                    {statusDistribution.map((item) => (
                      <div key={item.status} className="flex items-center justify-between text-xs border-b border-[#e0e0e0] py-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 border border-[#808080] bg-[#d4d0c8] font-bold text-[10px]">
                            {STATUS_LABELS[item.status] || item.status}
                          </span>
                          <span className="text-gray-600">{item.count} reparaciones</span>
                        </div>
                        <span className="font-bold font-mono">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Desempeño por técnico */}
              <Section title="Desempeño por Técnico">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#d4d0c8] border-b-2 border-[#808080]">
                        {['Técnico', 'Total', 'Completadas', 'En Proceso', 'T. Prom.', 'Ingresos'].map((h, i) => (
                          <th key={i} className={`px-2 py-1 font-bold border-r border-[#808080] last:border-r-0 ${i >= 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {technicianStats.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-6 text-gray-500">Sin datos de técnicos</td></tr>
                      ) : technicianStats.map((tech, idx) => (
                        <tr key={tech.technician_id} className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] font-bold">{tech.technician_name}</td>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono">{tech.total_repairs}</td>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono text-green-700">{tech.completed_repairs}</td>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono text-orange-700">{tech.in_progress_repairs}</td>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono">{tech.average_repair_days}d</td>
                          <td className="px-2 py-1 text-right font-mono font-bold">{fmt(tech.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* Rentabilidad */}
              <Section title="Rentabilidad por Reparación (Top 10)">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#d4d0c8] border-b-2 border-[#808080]">
                        {['Orden', 'Cliente', 'Repuestos', 'Mano de Obra', 'Cobrado', 'Ganancia', 'Margen'].map((h, i) => (
                          <th key={i} className={`px-2 py-1 font-bold border-r border-[#808080] last:border-r-0 ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {profitability.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-6 text-gray-500">Sin datos de rentabilidad</td></tr>
                      ) : profitability.slice(0, 10).map((item, idx) => (
                        <tr key={item.repair_order_id} className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] font-mono font-bold">#{item.order_number}</td>
                          <td className="px-2 py-1 border-r border-[#e0e0e0]">{item.customer_name}</td>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono">{fmt(item.parts_cost)}</td>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono">{fmt(item.labor_cost)}</td>
                          <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono">{fmt(item.total_paid)}</td>
                          <td className={`px-2 py-1 border-r border-[#e0e0e0] text-right font-mono font-bold ${item.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(item.profit)}</td>
                          <td className={`px-2 py-1 text-right font-mono font-bold ${item.profit_margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{item.profit_margin.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* Exportar */}
              <Section title="Exportar Reporte">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '📊 Excel', type: 'excel' as const, icon: <FileSpreadsheet className="h-3 w-3" /> },
                    { label: '📄 PDF', type: 'pdf' as const, icon: <FileText className="h-3 w-3" /> },
                    { label: '🖨 Imprimir', type: 'print' as const, icon: <Printer className="h-3 w-3" /> },
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      onClick={() => handleExport(btn.type)}
                      disabled={exporting || loading}
                      className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1"
                    >
                      {btn.icon} {btn.label}
                    </button>
                  ))}
                  {exporting && <span className="text-xs text-gray-500 self-center">Generando...</span>}
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
