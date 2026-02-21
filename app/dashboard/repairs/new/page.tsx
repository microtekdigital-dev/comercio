'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createRepairOrder } from '@/lib/actions/repair-orders'
import { getCustomers } from '@/lib/actions/customers'
import { getTechnicians } from '@/lib/actions/technicians'
import { useToast } from '@/hooks/use-toast'
import { NewCustomerModal } from '@/components/dashboard/new-customer-modal'
import { Plus } from 'lucide-react'
import type { Customer, Technician } from '@/lib/types/erp'

export default function NewRepairPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [companyId, setCompanyId] = useState<string>('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  // Form state
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
    loadData()
  }, [])

  async function loadData() {
    try {
      // Get company ID from user session
      const response = await fetch('/api/user/session')
      const session = await response.json()
      
      if (!session.company_id) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener la información de la empresa',
          variant: 'destructive'
        })
        return
      }

      setCompanyId(session.company_id)

      // Load customers and technicians
      const [customersData, techniciansData] = await Promise.all([
        getCustomers(),
        getTechnicians(session.company_id, true)
      ])

      setCustomers(customersData)
      setTechnicians(techniciansData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar datos',
        variant: 'destructive'
      })
    }
  }

  function handleCustomerCreated(newCustomer: Customer) {
    setCustomers(prev => [newCustomer, ...prev])
    setCustomerId(newCustomer.id)
    toast({
      title: 'Cliente agregado',
      description: 'El cliente ha sido seleccionado automáticamente'
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate required fields
    if (!customerId) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar un cliente',
        variant: 'destructive'
      })
      return
    }

    if (!deviceType.trim()) {
      toast({
        title: 'Error',
        description: 'El tipo de dispositivo es requerido',
        variant: 'destructive'
      })
      return
    }

    if (!brand.trim()) {
      toast({
        title: 'Error',
        description: 'La marca es requerida',
        variant: 'destructive'
      })
      return
    }

    if (!model.trim()) {
      toast({
        title: 'Error',
        description: 'El modelo es requerido',
        variant: 'destructive'
      })
      return
    }

    if (!reportedProblem.trim()) {
      toast({
        title: 'Error',
        description: 'El problema reportado es requerido',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const order = await createRepairOrder(companyId, {
        customer_id: customerId,
        technician_id: technicianId || undefined,
        device_type: deviceType,
        brand,
        model,
        serial_number: serialNumber || undefined,
        accessories: accessories || undefined,
        reported_problem: reportedProblem,
        estimated_delivery_date: estimatedDeliveryDate || undefined
      })

      toast({
        title: 'Éxito',
        description: `Orden de reparación #${order.order_number} creada correctamente`
      })

      router.push(`/dashboard/repairs/${order.id}`)
    } catch (error) {
      console.error('Error creating repair order:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear orden de reparación',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva Orden de Reparación</h1>
        <p className="text-muted-foreground">
          Registra el ingreso de un dispositivo para reparación
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
            <CardDescription>Selecciona el cliente propietario del dispositivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente *</Label>
              <div className="flex gap-2">
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customer" className="flex-1">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCustomerModal(true)}
                  title="Crear nuevo cliente"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Dispositivo */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Dispositivo</CardTitle>
            <CardDescription>Datos del equipo a reparar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceType">Tipo de Dispositivo *</Label>
                <Input
                  id="deviceType"
                  placeholder="Ej: Notebook, Tablet, Televisor"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  placeholder="Ej: Samsung, Apple, LG"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  placeholder="Ej: Galaxy S21, MacBook Pro"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Serie</Label>
                <Input
                  id="serialNumber"
                  placeholder="Opcional"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessories">Accesorios Incluidos</Label>
              <Textarea
                id="accessories"
                placeholder="Ej: Cargador, funda, stylus"
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Problema Reportado */}
        <Card>
          <CardHeader>
            <CardTitle>Problema Reportado</CardTitle>
            <CardDescription>Descripción del problema según el cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="reportedProblem">Problema *</Label>
              <Textarea
                id="reportedProblem"
                placeholder="Describe el problema reportado por el cliente"
                value={reportedProblem}
                onChange={(e) => setReportedProblem(e.target.value)}
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Asignación y Fechas */}
        <Card>
          <CardHeader>
            <CardTitle>Asignación y Fechas</CardTitle>
            <CardDescription>Técnico responsable y fecha estimada de entrega</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technician">Técnico Asignado</Label>
                <Select value={technicianId || "unassigned"} onValueChange={(value) => setTechnicianId(value === "unassigned" ? "" : value)}>
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
                <Label htmlFor="estimatedDeliveryDate">Fecha Estimada de Entrega</Label>
                <Input
                  id="estimatedDeliveryDate"
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Orden de Reparación'}
          </Button>
        </div>
      </form>

      <NewCustomerModal
        open={showCustomerModal}
        onOpenChange={setShowCustomerModal}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  )
}
