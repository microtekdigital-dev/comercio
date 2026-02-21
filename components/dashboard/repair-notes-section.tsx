'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import type { RepairNote } from '@/lib/types/erp'
import { createRepairNote, updateRepairNote, deleteRepairNote } from '@/lib/actions/repair-notes'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface RepairNotesSectionProps {
  repairOrderId: string
  notes: RepairNote[]
  currentUserId?: string
  onUpdate: () => void
  readOnly?: boolean
}

export function RepairNotesSection({
  repairOrderId,
  notes,
  currentUserId,
  onUpdate,
  readOnly = false
}: RepairNotesSectionProps) {
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: 'Error',
        description: 'La nota no puede estar vacía',
        variant: 'destructive'
      })
      return
    }

    setProcessing(true)
    try {
      await createRepairNote(repairOrderId, newNote)
      toast({
        title: 'Nota agregada',
        description: 'La nota interna ha sido agregada correctamente'
      })
      setNewNote('')
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al agregar nota',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleStartEdit = (note: RepairNote) => {
    setEditingNoteId(note.id)
    setEditingNoteText(note.note)
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editingNoteText.trim()) {
      toast({
        title: 'Error',
        description: 'La nota no puede estar vacía',
        variant: 'destructive'
      })
      return
    }

    setProcessing(true)
    try {
      await updateRepairNote(noteId, editingNoteText)
      toast({
        title: 'Nota actualizada',
        description: 'La nota ha sido actualizada correctamente'
      })
      setEditingNoteId(null)
      setEditingNoteText('')
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar nota',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Está seguro de eliminar esta nota?')) {
      return
    }

    setProcessing(true)
    try {
      await deleteRepairNote(noteId)
      toast({
        title: 'Nota eliminada',
        description: 'La nota ha sido eliminada correctamente'
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar nota',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const canEditNote = (note: RepairNote) => {
    return currentUserId && note.created_by === currentUserId
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas Internas</CardTitle>
        <CardDescription>
          Observaciones y comentarios internos sobre la reparación (no visibles para el cliente)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        {!readOnly && (
          <div className="space-y-2">
            <Label htmlFor="new-note">Agregar Nota</Label>
            <Textarea
              id="new-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escriba una nota interna..."
              rows={3}
              disabled={processing}
            />
            <Button
              onClick={handleAddNote}
              disabled={processing || !newNote.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Nota
            </Button>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <Alert>
            <AlertDescription>
              No hay notas internas registradas para esta reparación
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-4 space-y-2 bg-muted/30"
              >
                {editingNoteId === note.id ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <Textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      rows={3}
                      disabled={processing}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={processing || !editingNoteText.trim()}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={processing}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="text-sm whitespace-pre-wrap">{note.note}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <div>
                        {formatDate(note.created_at)}
                        {note.updated_at && note.updated_at !== note.created_at && (
                          <span className="ml-2">(editado)</span>
                        )}
                      </div>
                      {!readOnly && canEditNote(note) && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(note)}
                            disabled={processing}
                            className="h-7 px-2"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={processing}
                            className="h-7 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
