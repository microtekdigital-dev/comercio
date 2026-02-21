'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RepairOrderWithDetails } from '@/lib/types/erp'
import { updateDiagnosis, approveBudget, rejectBudget } from '@/lib/actions/repair-orders'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface RepairDiagnosisSectionProps {
  order: RepairOrderWithDetails
  onUpdate: () => void
  readOnly?: boolean
}

export function RepairDiagnosisSection({
  order,
  onUpdate,
  readOnly = false
}: RepairDiagnosisSectionProps) {
  const [diagnosis, setDiagnosis] = useState(order.diagnosis || '')
  const [savingDiagnosis, setSavingDiagnosis] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [cancelOnReject, setCancelOnReject] = useState(false)
  const [processingApproval, setProcessingApproval] = useState(false)

  const handleSaveDiagnosis = async () => {
    if (!diagnosis.trim()) {
      toast({
        title: 'Error',
        description: 'El diagnóstico no puede estar vacío',
        variant: 'destructive'
      })
      return
    }

    setSavingDiagnosis(true)
    try {
      await updateDiagnosis(order.id, diagnosis)
      toast({
        title: 'Diagnóstico guardado',
        description: 'El diagnóstico ha sido actualizado correctamente'
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar diagnóstico',
        variant: 'destructive'
      })
    } finally {
      setSavingDiagnosis(false)
    }
  }

  const handleOpenApprovalDialog = (action: 'approve' | 'reject') => {
    setApprovalAction(action)
    setApprovalNotes('')
    setCancelOnReject(false)
    setShowApprovalDialog(true)
  }

  const handleProcessApproval = async () => {
    setProcessingApproval(true)
    try {
      if (approvalAction === 'approve') {
        await approveBudget(order.id, approvalNotes)
        toast({
          title: 'Presupuesto aprobado',
          description: 'El presupuesto ha sido aprobado por el cliente'
        })
      } else {
        await rejectBudget(order.id, approvalNotes, cancelOnReject)
        toast({
          title: 'Presupuesto rechazado',
          description: cancelOnReject 
            ? 'El presupuesto ha sido rechazado y la orden cancelada'
            : 'El presupuesto ha sido rechazado'
        })
      }
      setShowApprovalDialog(false)
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al procesar aprobación',
        variant: 'destructive'
      })
    } finally {
      setProcessingApproval(false)
    }
  }

  const canEditDiagnosis = !readOnly && order.status !== 'delivered' && order.status !== 'cancelled'
  const canApprove = !readOnly && order.diagnosis && order.budget_approved === null && order.total_cost > 0
  const hasApprovalDecision = order.budget_approved !== null

  return (
    <div className="space-y-6">
      {/* Diagnosis Section */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico Técnico</CardTitle>
          <CardDescription>
            Evaluación técnica del problema del dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Ingrese el diagnóstico técnico detallado..."
              rows={6}
              disabled={!canEditDiagnosis}
            />
          </div>

          {order.diagnosis_date && (
            <div className="text-sm text-muted-foreground">
              Diagnóstico realizado el {formatDate(order.diagnosis_date)}
            </div>
          )}

          {canEditDiagnosis && (
            <Button
              onClick={handleSaveDiagnosis}
              disabled={savingDiagnosis || !diagnosis.trim() || diagnosis === order.diagnosis}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Diagnóstico
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Budget Approval Section */}
      {order.diagnosis && (
        <Card>
          <CardHeader>
            <CardTitle>Aprobación del Presupuesto</CardTitle>
            <CardDescription>
              Decisión del cliente sobre el presupuesto presentado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasApprovalDecision ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Estado:</span>
                  {order.budget_approved ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Aprobado
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Rechazado
                    </Badge>
                  )}
                </div>

                {order.approval_date && (
                  <div className="text-sm text-muted-foreground">
                    Fecha de decisión: {formatDate(order.approval_date)}
                  </div>
                )}

                {order.approval_notes && (
                  <div className="space-y-1">
                    <Label>Observaciones:</Label>
                    <div className="text-sm p-3 bg-muted rounded-md">
                      {order.approval_notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {order.total_cost === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Agregue repuestos y/o mano de obra para generar el presupuesto
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      El presupuesto está pendiente de aprobación por el cliente
                    </div>

                    {canApprove && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleOpenApprovalDialog('approve')}
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar Presupuesto
                        </Button>
                        <Button
                          onClick={() => handleOpenApprovalDialog('reject')}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar Presupuesto
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Aprobar Presupuesto' : 'Rechazar Presupuesto'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? 'Confirme que el cliente ha aprobado el presupuesto para proceder con la reparación.'
                : 'Registre el rechazo del presupuesto por parte del cliente.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approval-notes">
                Observaciones {approvalAction === 'approve' ? '(opcional)' : ''}
              </Label>
              <Textarea
                id="approval-notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Ingrese observaciones sobre la decisión del cliente..."
                rows={3}
              />
            </div>

            {approvalAction === 'reject' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cancel-order"
                  checked={cancelOnReject}
                  onChange={(e) => setCancelOnReject(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="cancel-order" className="text-sm font-normal cursor-pointer">
                  Cancelar la orden de reparación
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={processingApproval}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessApproval}
              disabled={processingApproval}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
            >
              {approvalAction === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
