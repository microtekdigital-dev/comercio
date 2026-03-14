'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Save, Upload, AlertCircle, CheckCircle2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getARCAConfig, saveARCAConfig, saveCertificate, validateCertificate } from '@/lib/actions/arca/configuration'
import { Environment } from '@/lib/types/arca'

export function ARCAConfiguration() {
  const [loading, setLoading] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [cuit, setCuit] = useState('')
  const [pointOfSale, setPointOfSale] = useState('')
  const [environment, setEnvironment] = useState<Environment>(Environment.TESTING)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificatePassword, setCertificatePassword] = useState('')
  const [certificateExpiration, setCertificateExpiration] = useState<Date | null>(null)
  const [hasExistingConfig, setHasExistingConfig] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    setLoadingConfig(true)
    try {
      const result = await getARCAConfig()
      
      if (result.success && result.config) {
        setCuit(result.config.cuit)
        setPointOfSale(result.config.pointOfSale.toString())
        setEnvironment(result.config.environment)
        setHasExistingConfig(true)
        
        // TODO: Load certificate expiration date if available
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
    } finally {
      setLoadingConfig(false)
    }
  }

  const validateCUIT = (value: string): boolean => {
    // CUIT must be exactly 11 digits
    const cuitRegex = /^\d{11}$/
    return cuitRegex.test(value)
  }

  const handleCUITChange = (value: string) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '')
    setCuit(cleaned)
    
    // Validate format
    if (cleaned && !validateCUIT(cleaned)) {
      setValidationErrors(prev => {
        if (!prev.includes('cuit')) {
          return [...prev, 'cuit']
        }
        return prev
      })
    } else {
      setValidationErrors(prev => prev.filter(e => e !== 'cuit'))
    }
  }

  const handleCertificateFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file extension
    if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
      toast.error('El certificado debe ser un archivo .pfx o .p12')
      return
    }

    setCertificateFile(file)
    
    // Validate certificate
    if (certificatePassword) {
      await validateCertificateFile(file, certificatePassword)
    }
  }

  const validateCertificateFile = async (file: File, password: string) => {
    try {
      const buffer = await file.arrayBuffer()
      const result = await validateCertificate({
        pfxData: Buffer.from(buffer),
        password
      })

      if (result.success && result.validation) {
        if (result.validation.valid) {
          toast.success('Certificado válido')
          setCertificateExpiration(result.validation.expirationDate || null)
          setValidationErrors(prev => prev.filter(e => e !== 'certificate'))
        } else {
          toast.error(result.validation.errors?.join(', ') || 'Certificado inválido')
          setValidationErrors(prev => {
            if (!prev.includes('certificate')) {
              return [...prev, 'certificate']
            }
            return prev
          })
        }
      }
    } catch (error) {
      console.error('Error validating certificate:', error)
      toast.error('Error al validar el certificado')
    }
  }

  const handleSave = async () => {
    // Validate all fields
    const errors: string[] = []

    if (!cuit) {
      errors.push('El CUIT es requerido')
    } else if (!validateCUIT(cuit)) {
      errors.push('El CUIT debe tener exactamente 11 dígitos')
    }

    if (!pointOfSale) {
      errors.push('El punto de venta es requerido')
    } else if (parseInt(pointOfSale) < 1 || parseInt(pointOfSale) > 9999) {
      errors.push('El punto de venta debe estar entre 1 y 9999')
    }

    if (!hasExistingConfig && !certificateFile) {
      errors.push('Debe cargar un certificado digital')
    }

    if (certificateFile && !certificatePassword) {
      errors.push('Debe ingresar la contraseña del certificado')
    }

    if (errors.length > 0) {
      toast.error(errors.join('. '))
      return
    }

    setLoading(true)
    try {
      // Save certificate if provided
      if (certificateFile && certificatePassword) {
        const buffer = await certificateFile.arrayBuffer()
        const certResult = await saveCertificate({
          pfxData: Buffer.from(buffer),
          password: certificatePassword
        })

        if (!certResult.success) {
          toast.error(certResult.error || 'Error al guardar el certificado')
          setLoading(false)
          return
        }
      }

      // Save configuration
      const configResult = await saveARCAConfig({
        cuit,
        pointOfSale: parseInt(pointOfSale),
        environment
      })

      if (configResult.success) {
        toast.success('Configuración guardada exitosamente')
        setHasExistingConfig(true)
        setCertificateFile(null)
        setCertificatePassword('')
      } else {
        toast.error(configResult.error || 'Error al guardar la configuración')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  if (loadingConfig) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Cargando configuración...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de ARCA</CardTitle>
        <CardDescription>
          Configure los certificados digitales y credenciales para facturación electrónica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CUIT */}
        <div className="space-y-2">
          <Label htmlFor="cuit">
            CUIT de la Empresa
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="cuit"
            placeholder="20123456789"
            value={cuit}
            onChange={(e) => handleCUITChange(e.target.value)}
            maxLength={11}
            className={validationErrors.includes('cuit') ? 'border-destructive' : ''}
          />
          {validationErrors.includes('cuit') && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              El CUIT debe tener exactamente 11 dígitos
            </p>
          )}
          {cuit && validateCUIT(cuit) && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              CUIT válido
            </p>
          )}
        </div>

        {/* Point of Sale */}
        <div className="space-y-2">
          <Label htmlFor="pointOfSale">
            Punto de Venta
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="pointOfSale"
            type="number"
            placeholder="1"
            value={pointOfSale}
            onChange={(e) => setPointOfSale(e.target.value)}
            min={1}
            max={9999}
          />
          <p className="text-sm text-muted-foreground">
            Número asignado por AFIP para identificar el punto de emisión (1-9999)
          </p>
        </div>

        {/* Environment */}
        <div className="space-y-2">
          <Label htmlFor="environment">
            Ambiente
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Select value={environment} onValueChange={(value) => setEnvironment(value as Environment)}>
            <SelectTrigger id="environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Environment.TESTING}>
                Testing (Homologación)
              </SelectItem>
              <SelectItem value={Environment.PRODUCTION}>
                Producción
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Use Testing para pruebas y Producción para comprobantes reales
          </p>
        </div>

        {/* Certificate Upload */}
        <div className="space-y-2">
          <Label htmlFor="certificate">
            Certificado Digital (.pfx)
            {!hasExistingConfig && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Input
              id="certificate"
              type="file"
              accept=".pfx,.p12"
              onChange={handleCertificateFileChange}
              className="flex-1"
            />
            {certificateFile && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {certificateFile.name}
              </Badge>
            )}
          </div>
          {hasExistingConfig && (
            <p className="text-sm text-muted-foreground">
              Ya tiene un certificado configurado. Solo cargue uno nuevo si desea reemplazarlo.
            </p>
          )}
        </div>

        {/* Certificate Password */}
        {certificateFile && (
          <div className="space-y-2">
            <Label htmlFor="certificatePassword">
              Contraseña del Certificado
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="certificatePassword"
              type="password"
              placeholder="••••••••"
              value={certificatePassword}
              onChange={(e) => setCertificatePassword(e.target.value)}
              onBlur={() => {
                if (certificateFile && certificatePassword) {
                  validateCertificateFile(certificateFile, certificatePassword)
                }
              }}
            />
          </div>
        )}

        {/* Certificate Expiration */}
        {certificateExpiration && (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              El certificado vence el{' '}
              {certificateExpiration.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor, corrija los errores antes de guardar
            </AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading || validationErrors.length > 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
