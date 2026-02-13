"use client"

import { useState, useEffect, memo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, AlertCircle, Save, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VARIANT_TYPES, type VariantType, type ProductVariantFormData, type VariantTemplate } from "@/lib/types/erp"
import { getVariantTemplates, createVariantTemplate } from "@/lib/actions/variant-templates"
import { toast } from "sonner"

interface VariantStockTableProps {
  variants: ProductVariantFormData[]
  onChange: (variants: ProductVariantFormData[]) => void
  variantType: VariantType
  readOnly?: boolean
}

export const VariantStockTable = memo(function VariantStockTable({
  variants,
  onChange,
  variantType,
  readOnly = false
}: VariantStockTableProps) {
  const [localVariants, setLocalVariants] = useState<ProductVariantFormData[]>(variants)
  const [errors, setErrors] = useState<string[]>([])
  const previousVariantTypeRef = useRef<VariantType | null>(null)
  const [templates, setTemplates] = useState<VariantTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Load templates when component mounts or variant type changes to custom
  useEffect(() => {
    if (variantType === 'custom') {
      loadTemplates()
    }
  }, [variantType])

  // Sync variants from props when they change (e.g., when loading existing product)
  useEffect(() => {
    if (variants.length > 0 && localVariants.length === 0) {
      setLocalVariants(variants)
    }
  }, [variants])

  const loadTemplates = async () => {
    const data = await getVariantTemplates()
    setTemplates(data)
  }

  // Initialize variants when variant type changes
  useEffect(() => {
    // Only run when variantType actually changes
    if (previousVariantTypeRef.current === variantType) {
      return
    }
    
    const previousType = previousVariantTypeRef.current
    previousVariantTypeRef.current = variantType

    if (variantType === 'none') {
      setLocalVariants([])
      onChange([])
      return
    }

    // If switching to predefined type (shirts or pants)
    if (variantType === 'shirts' || variantType === 'pants') {
      // Only regenerate if:
      // 1. We're switching from another type (previousType exists and is different)
      // 2. OR we don't have variants (new product)
      const shouldRegenerate = (previousType !== null && previousType !== variantType) || variants.length === 0
      
      if (shouldRegenerate) {
        const sizes = VARIANT_TYPES[variantType].sizes
        const newVariants: ProductVariantFormData[] = sizes.map((size, index) => ({
          variant_name: size,
          sku: '',
          stock_quantity: 0,
          min_stock_level: 0,
          sort_order: index
        }))
        setLocalVariants(newVariants)
        onChange(newVariants)
      }
      return
    }
    
    // For custom type
    if (variantType === 'custom') {
      // If we're switching from a predefined type, clear variants
      if (previousType === 'shirts' || previousType === 'pants') {
        setLocalVariants([])
        onChange([])
        setSelectedTemplateId("")
      }
      // If previousType is null (initial load) and no variants, also clear
      else if (previousType === null && variants.length === 0) {
        setLocalVariants([])
        onChange([])
        setSelectedTemplateId("")
      }
      // Otherwise keep existing variants (loading existing product)
    }
  }, [variantType, onChange])

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    
    if (templateId === "new") {
      // Clear variants for new configuration
      setLocalVariants([])
      onChange([])
      return
    }

    const template = templates.find(t => t.id === templateId)
    if (template) {
      const newVariants: ProductVariantFormData[] = template.sizes.map((size, index) => ({
        variant_name: size,
        sku: '',
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index
      }))
      setLocalVariants(newVariants)
      onChange(newVariants)
    }
  }

  // Handle save template
  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("El nombre de la plantilla es requerido")
      return
    }

    if (localVariants.length === 0) {
      toast.error("Debes tener al menos una variante para guardar como plantilla")
      return
    }

    setSavingTemplate(true)
    const sizes = localVariants.map(v => v.variant_name).filter(name => name.trim())
    
    const result = await createVariantTemplate(newTemplateName, sizes)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Plantilla guardada exitosamente")
      setShowSaveDialog(false)
      setNewTemplateName("")
      await loadTemplates()
    }
    
    setSavingTemplate(false)
  }

  // Validate variants
  useEffect(() => {
    const newErrors: string[] = []
    
    // Check for duplicate names (case-insensitive)
    const names = localVariants.map(v => v.variant_name.toLowerCase().trim())
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
    if (duplicates.length > 0) {
      newErrors.push('Hay nombres de variantes duplicados')
    }

    // Check for negative stock
    const hasNegativeStock = localVariants.some(v => v.stock_quantity < 0 || v.min_stock_level < 0)
    if (hasNegativeStock) {
      newErrors.push('El stock no puede ser negativo')
    }

    // Check for empty names
    const hasEmptyNames = localVariants.some(v => !v.variant_name.trim())
    if (hasEmptyNames) {
      newErrors.push('Todas las variantes deben tener un nombre')
    }

    setErrors(newErrors)
  }, [localVariants])

  const handleVariantChange = (index: number, field: keyof ProductVariantFormData, value: string | number) => {
    const updated = [...localVariants]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    setLocalVariants(updated)
    onChange(updated)
  }

  const handleAddVariant = () => {
    const newVariant: ProductVariantFormData = {
      variant_name: '',
      sku: '',
      stock_quantity: 0,
      min_stock_level: 0,
      sort_order: localVariants.length
    }
    const updated = [...localVariants, newVariant]
    setLocalVariants(updated)
    onChange(updated)
  }

  const handleRemoveVariant = (index: number) => {
    const updated = localVariants.filter((_, i) => i !== index)
    // Update sort_order
    updated.forEach((v, i) => v.sort_order = i)
    setLocalVariants(updated)
    onChange(updated)
  }

  const totalStock = localVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
  const isPredefined = variantType === 'shirts' || variantType === 'pants'

  if (variantType === 'none') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock por Variante</CardTitle>
        <CardDescription>
          {isPredefined
            ? `Gestiona el stock de cada talla de ${VARIANT_TYPES[variantType].label.toLowerCase()}`
            : 'Define y gestiona tus variantes personalizadas'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template selector for custom variants */}
        {variantType === 'custom' && !readOnly && (
          <div className="space-y-2">
            <Label>Plantilla de Variantes</Label>
            <div className="flex gap-2">
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Nueva configuración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nueva configuración</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name} ({template.sizes.length} tallas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localVariants.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSaveDialog(true)}
                  title="Guardar como plantilla"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  {isPredefined ? 'Talla' : 'Nombre de Variante'}
                </TableHead>
                <TableHead className="w-[200px]">SKU (opcional)</TableHead>
                <TableHead className="w-[150px]">Stock</TableHead>
                <TableHead className="w-[150px]">Stock Mínimo</TableHead>
                {!isPredefined && !readOnly && (
                  <TableHead className="w-[80px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {localVariants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isPredefined ? 4 : 5} className="text-center text-muted-foreground py-8">
                    No hay variantes configuradas
                  </TableCell>
                </TableRow>
              ) : (
                localVariants.map((variant, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {isPredefined ? (
                        <div className="font-medium">{variant.variant_name}</div>
                      ) : (
                        <Input
                          value={variant.variant_name}
                          onChange={(e) => handleVariantChange(index, 'variant_name', e.target.value)}
                          placeholder="Ej: Mediano, Grande..."
                          disabled={readOnly}
                          className="max-w-[180px]"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku || ''}
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        placeholder="SKU"
                        disabled={readOnly}
                        className="max-w-[180px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock_quantity}
                        onChange={(e) => handleVariantChange(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                        disabled={readOnly}
                        className="max-w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={variant.min_stock_level}
                        onChange={(e) => handleVariantChange(index, 'min_stock_level', parseInt(e.target.value) || 0)}
                        disabled={readOnly}
                        className="max-w-[120px]"
                      />
                    </TableCell>
                    {!isPredefined && !readOnly && (
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariant(index)}
                          disabled={readOnly}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isPredefined && !readOnly && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddVariant}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Variante
          </Button>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Label className="text-base font-medium">Stock Total:</Label>
          <div className="text-2xl font-bold">{totalStock} unidades</div>
        </div>

        {/* Save Template Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guardar como Plantilla</DialogTitle>
              <DialogDescription>
                Guarda esta configuración de variantes para reutilizarla en otros productos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Ej: Ropa Estándar, Calzado..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tallas a guardar:</Label>
                <div className="text-sm text-muted-foreground">
                  {localVariants.map(v => v.variant_name).join(", ")}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false)
                  setNewTemplateName("")
                }}
                disabled={savingTemplate}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
              >
                {savingTemplate ? "Guardando..." : "Guardar Plantilla"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
})
