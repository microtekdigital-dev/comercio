'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Send, DollarSign, Package, FileText, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RepairItemsTable } from '@/components/dashboard/repair-items-table'
import { RepairPaymentModal } from '@/components/dashboard/repair-payment-modal'
import { RepairDiagnosisSection } from '@/components/dashboard/repair-diagnosis-section'
import { RepairNotesSection } from '@/components/dashboard/repair-notes-section'
import { AddRepairItemModal } from '@/components/dashboard/add-repair-item-modal'
import { SendRepairEmailModal } from '@/components/dashboard/send-repair-email-modal'
import { getRepairOrderById, updateRepairOrder, updateRepairStatus } from '@/lib/actions/repair-orders'
import { resendNotification } from '@/lib/actions/repair-notifications'
import { getTechnicians } from '@/lib/actions/technicians'
import { getCompanyInfo } from '@/lib/actions/company'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { RepairOrderWithDetails, Technician, RepairStatus } from '@/lib/types/erp'

const STATUS_OPTIONS: { value: RepairStatus; label: string; variant: 'default' | 'secondary' | 'destructive' }[] = [
  { value: 'received', label: 'Recibido', variant: 'secondary' },
  { value: 'diagnosing', label: 'En Diagnóstico', variant: 'default' },
  { value: 'waiting_parts', label: 'Esperando Repuestos', variant: 'secondary' },
  { value: 'repairing', label: 'En Reparación', variant: 'default' },
  { value: 'repaired', label: 'Reparado', variant: 'default' },
  { value: 'delivered', label: 'Entregado', variant: 'default' },
  { value: 'cancelled', label: 'Cancelado', variant: 'destructive' },
]

export default function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<RepairOrderWithDetails | null>(null)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [sendingNotification, setSendingNotification] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<any>(null)

  // Editable fields
  const [technicianId, setTechnicianId] = useState('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')
  const [laborCost, setLaborCost] = useState('')
  const [status, setStatus] = useState<RepairStatus>('received')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)

      // Get user session
      const sessionResponse = await fetch('/api/user/session')
      const session = await sessionResponse.json()
      setCurrentUserId(session.user_id)

      // Load repair order
      const orderData = await getRepairOrderById(id)
      if (!orderData) {
        toast({
          title: 'Error',
          description: 'Orden de reparación no encontrada',
          variant: 'destructive'
        })
        router.push('/dashboard/repairs')
        return
      }

      setOrder(orderData)
      setTechnicianId(orderData.technician_id || '')
      setEstimatedDeliveryDate(orderData.estimated_delivery_date || '')
      setLaborCost(orderData.labor_cost?.toString() || '0')
      setStatus(orderData.status)

      // Load technicians
      const techniciansData = await getTechnicians(orderData.company_id, true)
      setTechnicians(techniciansData)

      // Load company info for notifications
      const companyData = await getCompanyInfo()
      if (companyData) {
        setCompanyInfo({
          name: companyData.name || 'Servicio Técnico',
          phone: companyData.phone || undefined,
          email: companyData.email || undefined,
          address: companyData.address || undefined
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar datos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBasicInfo() {
    if (!order) return

    setSaving(true)
    try {
      await updateRepairOrder(order.id, {
        technician_id: technicianId || undefined,
        estimated_delivery_date: estimatedDeliveryDate || undefined,
        labor_cost: parseFloat(laborCost) || 0
      })

      toast({
        title: 'Información actualizada',
        description: 'Los cambios han sido guardados correctamente'
      })

      await loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar cambios',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(newStatus: RepairStatus) {
    if (!order) return

    if (!confirm(`¿Cambiar el estado a "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"?`)) {
      return
    }

    setSaving(true)
    try {
      await updateRepairStatus(order.id, newStatus)
      
      let description = 'El estado de la reparación ha sido actualizado'
      if (newStatus === 'repaired') {
        description += '. Se ha enviado una notificación al cliente.'
      }
      
      toast({
        title: 'Estado actualizado',
        description
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar estado',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleResendNotification() {
    if (!order) return

    if (!confirm('¿Reenviar notificación al cliente?')) {
      return
    }

    setSendingNotification(true)
    try {
      const result = await resendNotification(order.id, companyInfo)
      
      if (result.success) {
        toast({
          title: 'Notificación enviada',
          description: 'La notificación ha sido enviada al cliente correctamente'
        })
        await loadData()
      } else {
        toast({
          title: 'Error al enviar notificación',
          description: result.error || 'No se pudo enviar la notificación',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al enviar notificación',
        variant: 'destructive'
      })
    } finally {
      setSendingNotification(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === order.status)
  const isOverdue = order.estimated_delivery_date && 
    new Date(order.estimated_delivery_date) < new Date() && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled'

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orden de Reparación #{order.order_number}</h1>
            <p className="text-muted-foreground mt-1">
              Cliente: {order.customer.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={currentStatus?.variant}>
              {currentStatus?.label}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive">Vencida</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push(`/dashboard/repairs/${order.id}/print`)}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Orden
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowEmailModal(true)}
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar Presupuesto
        </Button>
        {(order.status === 'repaired' || order.status === 'delivered') && order.customer.email && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleResendNotification}
            disabled={sendingNotification}
          >
            {sendingNotification ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Reenviar Notificación
          </Button>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowPaymentModal(true)}
          disabled={order.balance <= 0}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Registrar Pago
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnóstico</TabsTrigger>
          <TabsTrigger value="parts">
            <Package className="h-4 w-4 mr-2" />
            Repuestos
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notas Internas
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          {/* Device Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Dispositivo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Tipo</Label>
                <div className="font-medium">{order.device_type}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Marca</Label>
                <div className="font-medium">{order.brand}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Modelo</Label>
                <div className="font-medium">{order.model}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Número de Serie</Label>
                <div className="font-medium">{order.serial_number || '-'}</div>
              </div>
              {order.accessories && (
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Accesorios</Label>
                  <div className="font-medium">{order.accessories}</div>
                </div>
              )}
              <div className="col-span-2">
                <Label className="text-muted-foreground">Problema Reportado</Label>
                <div className="font-medium whitespace-pre-wrap">{order.reported_problem}</div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment and Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Asignación y Fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technician">Técnico Asignado</Label>
                  <Select 
                    value={technicianId || "unassigned"} 
                    onValueChange={(v) => setTechnicianId(v === "unassigned" ? "" : v)}
                  >
                    <SelectTrigger id="technician">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name} {tech.specialty && `- ${tech.specialty}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated-date">Fecha Estimada de Entrega</Label>
                  <Input
                    id="estimated-date"
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labor-cost">Costo de Mano de Obra</Label>
                  <Input
                    id="labor-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={status} onValueChange={(v) => handleStatusChange(v as RepairStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Fecha de Ingreso</Label>
                  <div className="font-medium">{formatDate(order.received_date)}</div>
                </div>
                {order.repair_completed_date && (
                  <div>
                    <Label className="text-muted-foreground">Fecha de Reparación</Label>
                    <div className="font-medium">{formatDate(order.repair_completed_date)}</div>
                  </div>
                )}
                {order.delivered_date && (
                  <div>
                    <Label className="text-muted-foreground">Fecha de Entrega</Label>
                    <div className="font-medium">{formatDate(order.delivered_date)}</div>
                  </div>
                )}
              </div>

              <Button onClick={handleSaveBasicInfo} disabled={saving}>
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Repuestos:</span>
                  <span className="font-medium">{formatCurrency(order.total_parts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mano de Obra:</span>
                  <span className="font-medium">{formatCurrency(order.labor_cost)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagado:</span>
                  <span className="font-medium">{formatCurrency(order.total_paid)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Saldo:</span>
                  <span className={order.balance > 0 ? 'text-destructive' : 'text-green-600'}>
                    {formatCurrency(order.balance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnosis Tab */}
        <TabsContent value="diagnosis">
          <RepairDiagnosisSection
            order={order}
            onUpdate={loadData}
          />
        </TabsContent>

        {/* Parts Tab */}
        <TabsContent value="parts">
          <RepairItemsTable
            items={order.items}
            laborCost={order.labor_cost}
            onAddItem={() => setShowAddItemModal(true)}
            onItemsChange={loadData}
          />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <RepairNotesSection
            repairOrderId={order.id}
            notes={order.notes}
            currentUserId={currentUserId}
            onUpdate={loadData}
          />
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      <RepairPaymentModal
        order={order}
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onPaymentComplete={loadData}
      />

      {/* Add Item Modal */}
      <AddRepairItemModal
        open={showAddItemModal}
        onOpenChange={setShowAddItemModal}
        repairOrderId={order.id}
        onSuccess={loadData}
      />

      {/* Send Email Modal */}
      <SendRepairEmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        repairOrderId={order.id}
        customerEmail={order.customer.email || undefined}
        customerName={order.customer.name}
        orderNumber={order.order_number}
        onSuccess={loadData}
      />
    </div>
  )
}
