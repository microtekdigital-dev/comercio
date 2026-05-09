'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createRepairOrder } from '@/lib/actions/repair-orders'
import { getCustomers } from '@/lib/actions/customers'
import { getTechnicians } from '@/lib/actions/technicians'
import { NewCustomerModal } from '@/components/dashboard/new-customer-modal'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Customer, Technician } from '@/lib/types/erp'

export default function NewRepairPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [companyId, setCompanyId] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [deviceType, setDeviceType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [accessories, setAccessories] = useState('')
  const [reportedProblem, setReportedProblem] = useState('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')

  useEffect(() => {
    fetch('/api/user/session').then(r => r.json()).then(session => {
      if (!session.company_id) { toast.error('No se pudo obtener la empresa'); return; }
      setCompanyId(session.company_id)
      Promise.all([getCustomers(), getTechnicians(session.company_id, true)])
        .then(([c, t]) => { setCustomers(c); setTechnicians(t); })
    }).catch(() => toast.error('Error al cargar datos'))
  }, [])

  const handleCustomerCreated = (c: Customer) => {
    setCustomers(prev => [c, ...prev])
    setCustomerId(c.id)
    toast.success('Cliente creado y seleccionado')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) { toast.error('Seleccioná un cliente'); return; }
    if (!deviceType.trim()) { toast.error('El tipo de dispositivo es requerido'); return; }
    if (!brand.trim()) { toast.error('La marca es requerida'); return; }
    if (!model.trim()) { toast.error('El modelo es requerido'); return; }
    if (!reportedProblem.trim()) { toast.error('El problema reportado es requerido'); return; }
    setLoading(true)
    try {
      const order = await createRepairOrder(companyId, {
        customer_id: customerId, technician_id: technicianId || undefined,
        device_type: deviceType, brand, model,
        serial_number: serialNumber || undefined, accessories: accessories || undefined,
        reported_problem: reportedProblem, estimated_delivery_date: estimatedDeliveryDate || undefined,
      })
      toast.success(`Orden #${order.order_number} creada`)
      router.push(`/dashboard/repairs/${order.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la orden')
    } finally { setLoading(false) }
  }

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
  const l = "text-xs font-bold text-black block mb-0.5"

  const Section = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-3">
      <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
        <span className="text-xs font-bold">{title}</span>
        {sub && <span className="text-[10px] text-gray-600 ml-2">{sub}</span>}
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🔧 Nueva Orden de Reparación</span>
          <Link href="/dashboard/repairs" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#d4d0c8] p-4 space-y-3">
          <Section title="Cliente" sub="Propietario del dispositivo">
            <div className="flex gap-2">
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={f + " flex-1"}>
                <option value="">Seleccionar cliente...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowCustomerModal(true)} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 shrink-0">
                <Plus className="h-3 w-3" /> Nuevo
              </button>
            </div>
          </Section>

          <Section title="Dispositivo" sub="Datos del equipo a reparar">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Tipo de Dispositivo *</label>
                <input required value={deviceType} onChange={e => setDeviceType(e.target.value)} placeholder="Notebook, Tablet, TV..." className={f} />
              </div>
              <div>
                <label className={l}>Marca *</label>
                <input required value={brand} onChange={e => setBrand(e.target.value)} placeholder="Samsung, Apple, LG..." className={f} />
              </div>
              <div>
                <label className={l}>Modelo *</label>
                <input required value={model} onChange={e => setModel(e.target.value)} placeholder="Galaxy S21, MacBook Pro..." className={f} />
              </div>
              <div>
                <label className={l}>Número de Serie</label>
                <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Opcional" className={f} />
              </div>
              <div className="col-span-2">
                <label className={l}>Accesorios Incluidos</label>
                <textarea value={accessories} onChange={e => setAccessories(e.target.value)} rows={2} placeholder="Cargador, funda, stylus..." className={f + " resize-none"} />
              </div>
            </div>
          </Section>

          <Section title="Problema Reportado">
            <textarea required value={reportedProblem} onChange={e => setReportedProblem(e.target.value)} rows={4} placeholder="Describí el problema reportado por el cliente..." className={f + " resize-none"} />
          </Section>

          <Section title="Asignación y Fechas">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Técnico Asignado</label>
                <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className={f}>
                  <option value="">Sin asignar</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` — ${t.specialty}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className={l}>Fecha Estimada de Entrega</label>
                <input type="date" value={estimatedDeliveryDate} onChange={e => setEstimatedDeliveryDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={f} />
              </div>
            </div>
          </Section>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => router.back()} disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Creando...</> : "✔ Crear Orden"}
            </button>
          </div>
        </form>
      </div>

      <NewCustomerModal open={showCustomerModal} onOpenChange={setShowCustomerModal} onCustomerCreated={handleCustomerCreated} />
    </div>
  )
}
