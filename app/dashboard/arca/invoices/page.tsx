'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InvoiceStatusBadge } from '@/components/dashboard/arca/invoice-status-badge'
import { 
  Receipt, 
  Search, 
  Download, 
  Eye, 
  RotateCcw, 
  Ban,
  Filter,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { InvoiceType, InvoiceStatus } from '@/lib/types/arca'

// TODO: Import actual actions when implemented
// import { getElectronicInvoices, retryInvoice, cancelInvoice } from '@/lib/actions/arca/invoice-processor'

export default function ElectronicInvoicesPage() {
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPointOfSale, setFilterPointOfSale] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterType, filterStatus, filterPointOfSale, dateFrom, dateTo, invoices])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const result = await getElectronicInvoices()
      // if (result.success) {
      //   setInvoices(result.invoices || [])
      // }
      
      // Mock data for now
      setInvoices([])
      toast.info('Cargando facturas electrónicas...')
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Error al cargar las facturas')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...invoices]

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.invoice_number?.toString().includes(searchTerm) ||
        inv.cae?.includes(searchTerm) ||
        inv.customer_business_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(inv => inv.invoice_type === filterType)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === filterStatus)
    }

    // Point of sale filter
    if (filterPointOfSale !== 'all') {
      filtered = filtered.filter(inv => inv.point_of_sale?.toString() === filterPointOfSale)
    }

    // Date range
    if (dateFrom) {
      filtered = filtered.filter(inv => new Date(inv.issue_date) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter(inv => new Date(inv.issue_date) <= new Date(dateTo))
    }

    setFilteredInvoices(filtered)
  }

  const handleRetry = async (invoiceId: string) => {
    try {
      // TODO: Implement retry
      // const result = await retryInvoice(invoiceId)
      // if (result.success) {
      //   toast.success('Reintento programado')
      //   loadInvoices()
      // } else {
      //   toast.error(result.error || 'Error al reintentar')
      // }
      toast.info('Función de reintento en desarrollo')
    } catch (error) {
      toast.error('Error al reintentar el comprobante')
    }
  }

  const handleCancel = async (invoiceId: string) => {
    try {
      // TODO: Implement cancel
      // const result = await cancelInvoice(invoiceId, 'Anulación manual')
      // if (result.success) {
      //   toast.success('Comprobante anulado')
      //   loadInvoices()
      // } else {
      //   toast.error(result.error || 'Error al anular')
      // }
      toast.info('Función de anulación en desarrollo')
    } catch (error) {
      toast.error('Error al anular el comprobante')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatInvoiceNumber = (pointOfSale: number, invoiceNumber: number) => {
    return `${String(pointOfSale).padStart(5, '0')}-${String(invoiceNumber).padStart(8, '0')}`
  }

  const getInvoiceTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ')
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facturas Electrónicas</h2>
          <p className="text-muted-foreground">
            Gestión de comprobantes electrónicos ARCA
          </p>
        </div>
        <Link href="/dashboard/arca/configuration">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Número, CAE, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="filterType">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filterType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={InvoiceType.FACTURA_A}>Factura A</SelectItem>
                  <SelectItem value={InvoiceType.FACTURA_B}>Factura B</SelectItem>
                  <SelectItem value={InvoiceType.FACTURA_C}>Factura C</SelectItem>
                  <SelectItem value={InvoiceType.NOTA_CREDITO_A}>Nota Crédito A</SelectItem>
                  <SelectItem value={InvoiceType.NOTA_CREDITO_B}>Nota Crédito B</SelectItem>
                  <SelectItem value={InvoiceType.NOTA_CREDITO_C}>Nota Crédito C</SelectItem>
                  <SelectItem value={InvoiceType.NOTA_DEBITO_A}>Nota Débito A</SelectItem>
                  <SelectItem value={InvoiceType.NOTA_DEBITO_B}>Nota Débito B</SelectItem>
                  <SelectItem value={InvoiceType.NOTA_DEBITO_C}>Nota Débito C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="filterStatus">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filterStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={InvoiceStatus.DRAFT}>Borrador</SelectItem>
                  <SelectItem value={InvoiceStatus.PENDING}>Pendiente</SelectItem>
                  <SelectItem value={InvoiceStatus.AUTHORIZED}>Autorizado</SelectItem>
                  <SelectItem value={InvoiceStatus.REJECTED}>Rechazado</SelectItem>
                  <SelectItem value={InvoiceStatus.CANCELLED}>Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Point of Sale Filter */}
            <div className="space-y-2">
              <Label htmlFor="filterPointOfSale">Punto de Venta</Label>
              <Select value={filterPointOfSale} onValueChange={setFilterPointOfSale}>
                <SelectTrigger id="filterPointOfSale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {/* TODO: Populate with actual points of sale */}
                  <SelectItem value="1">Punto 1</SelectItem>
                  <SelectItem value="2">Punto 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comprobantes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron facturas electrónicas</p>
              <p className="text-sm text-muted-foreground mt-2">
                Las facturas generadas aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>CAE</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">
                        {formatInvoiceNumber(invoice.point_of_sale, invoice.invoice_number)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getInvoiceTypeLabel(invoice.invoice_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell>{invoice.customer_business_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        {invoice.cae ? (
                          <span className="font-mono text-sm">{invoice.cae}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/arca/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {invoice.pdf_url && (
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === InvoiceStatus.REJECTED && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRetry(invoice.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === InvoiceStatus.AUTHORIZED && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(invoice.id)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
