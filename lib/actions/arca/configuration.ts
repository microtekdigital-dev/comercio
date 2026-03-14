'use server'

import { createClient } from '@/lib/supabase/server'
import { Certificate, ARCAConfig, ValidationResult } from '@/lib/types/arca'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

// ============================================================================
// Constants
// ============================================================================

const ENCRYPTION_ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT = process.env.ARCA_ENCRYPTION_SALT || 'default-salt-change-in-production'

// ============================================================================
// Encryption Utilities
// ============================================================================

/**
 * Derives an encryption key from the salt
 */
function deriveKey(): Buffer {
  return scryptSync(SALT, 'salt', KEY_LENGTH)
}

/**
 * Encrypts data using AES-256-CBC
 */
function encrypt(data: Buffer): { encrypted: Buffer; iv: Buffer } {
  const key = deriveKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  
  return { encrypted, iv }
}

/**
 * Decrypts data using AES-256-CBC
 */
function decrypt(encrypted: Buffer, iv: Buffer): Buffer {
  const key = deriveKey()
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates CUIT/CUIL format (must be exactly 11 digits)
 * 
 * @param cuit - CUIT/CUIL string to validate
 * @returns ValidationResult with valid flag and errors if any
 */
export function validateCUIT(cuit: string): ValidationResult {
  // Remove any hyphens or spaces
  const cleanCuit = cuit.replace(/[-\s]/g, '')
  
  // Check if it's exactly 11 digits
  const isValid = /^\d{11}$/.test(cleanCuit)
  
  if (!isValid) {
    return {
      valid: false,
      errors: ['CUIT/CUIL debe tener exactamente 11 dígitos numéricos']
    }
  }
  
  return { valid: true }
}

/**
 * Validates certificate format and expiration
 * 
 * @param certificate - Certificate to validate
 * @returns ValidationResult with valid flag, errors, and expiration date
 */
export async function validateCertificate(certificate: Certificate): Promise<ValidationResult> {
  try {
    // Check if pfxData is a valid Buffer
    if (!Buffer.isBuffer(certificate.pfxData)) {
      return {
        valid: false,
        errors: ['El certificado debe ser un archivo .pfx válido']
      }
    }
    
    // Check if pfxData has content
    if (certificate.pfxData.length === 0) {
      return {
        valid: false,
        errors: ['El archivo de certificado está vacío']
      }
    }
    
    // Check if password is provided
    if (!certificate.password || certificate.password.trim().length === 0) {
      return {
        valid: false,
        errors: ['La contraseña del certificado es requerida']
      }
    }
    
    // Basic validation of PFX format (check for PKCS#12 magic bytes)
    // PFX files typically start with 0x30 (ASN.1 SEQUENCE)
    const firstByte = certificate.pfxData[0]
    if (firstByte !== 0x30) {
      return {
        valid: false,
        errors: ['El archivo no parece ser un certificado .pfx válido']
      }
    }
    
    // TODO: In a real implementation, we would use a library like 'node-forge'
    // to fully parse and validate the PFX certificate, extract expiration date, etc.
    // For now, we'll do basic validation
    
    return {
      valid: true,
      // In production, extract actual expiration date from certificate
      expirationDate: undefined
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`Error al validar certificado: ${error instanceof Error ? error.message : 'Error desconocido'}`]
    }
  }
}

// ============================================================================
// Certificate Management
// ============================================================================

/**
 * Saves a digital certificate with encryption
 * 
 * @param companyId - Company ID
 * @param certificate - Certificate to save
 * @param userId - User ID performing the operation
 * @param expirationDate - Certificate expiration date
 * @returns Certificate ID
 */
export async function saveCertificate(
  companyId: string,
  certificate: Certificate,
  userId: string,
  expirationDate: Date
): Promise<{ success: boolean; certificateId?: string; error?: string }> {
  try {
    // Validate certificate first
    const validation = await validateCertificate(certificate)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors?.join(', ')
      }
    }
    
    const supabase = await createClient()
    
    // Encrypt PFX data
    const { encrypted: encryptedPfx, iv: pfxIv } = encrypt(certificate.pfxData)
    
    // Encrypt password
    const passwordBuffer = Buffer.from(certificate.password, 'utf-8')
    const { encrypted: encryptedPassword, iv: passwordIv } = encrypt(passwordBuffer)
    
    // Combine encrypted data with IV for storage
    const pfxDataWithIv = Buffer.concat([pfxIv, encryptedPfx])
    const passwordWithIv = Buffer.concat([passwordIv, encryptedPassword]).toString('base64')
    
    // Insert into database
    const { data, error } = await supabase
      .from('arca_certificates')
      .insert({
        company_id: companyId,
        pfx_data_encrypted: pfxDataWithIv,
        password_encrypted: passwordWithIv,
        expiration_date: expirationDate.toISOString().split('T')[0],
        created_by: userId
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error saving certificate:', error)
      return {
        success: false,
        error: 'Error al guardar el certificado en la base de datos'
      }
    }
    
    return {
      success: true,
      certificateId: data.id
    }
  } catch (error) {
    console.error('Error in saveCertificate:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al guardar certificado'
    }
  }
}

/**
 * Retrieves and decrypts a digital certificate
 * 
 * @param companyId - Company ID
 * @returns Decrypted certificate or null if not found
 */
export async function getCertificate(
  companyId: string
): Promise<{ success: boolean; certificate?: Certificate; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get the most recent certificate for the company
    const { data, error } = await supabase
      .from('arca_certificates')
      .select('pfx_data_encrypted, password_encrypted, expiration_date')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      return {
        success: false,
        error: 'No se encontró certificado para esta empresa'
      }
    }
    
    // Check if certificate is expired
    const expirationDate = new Date(data.expiration_date)
    if (expirationDate < new Date()) {
      return {
        success: false,
        error: `El certificado venció el ${expirationDate.toLocaleDateString()}`
      }
    }
    
    // Extract IV and encrypted data for PFX
    const pfxDataWithIv = data.pfx_data_encrypted as Buffer
    const pfxIv = pfxDataWithIv.subarray(0, IV_LENGTH)
    const encryptedPfx = pfxDataWithIv.subarray(IV_LENGTH)
    
    // Extract IV and encrypted data for password
    const passwordWithIv = Buffer.from(data.password_encrypted, 'base64')
    const passwordIv = passwordWithIv.subarray(0, IV_LENGTH)
    const encryptedPassword = passwordWithIv.subarray(IV_LENGTH)
    
    // Decrypt
    const pfxData = decrypt(encryptedPfx, pfxIv)
    const passwordBuffer = decrypt(encryptedPassword, passwordIv)
    const password = passwordBuffer.toString('utf-8')
    
    return {
      success: true,
      certificate: {
        pfxData,
        password
      }
    }
  } catch (error) {
    console.error('Error in getCertificate:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener certificado'
    }
  }
}

// ============================================================================
// ARCA Configuration Management
// ============================================================================

/**
 * Saves ARCA configuration for a company
 * 
 * @param config - ARCA configuration
 * @returns Success status
 */
export async function saveARCAConfig(
  config: ARCAConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate CUIT
    const cuitValidation = validateCUIT(config.cuit)
    if (!cuitValidation.valid) {
      return {
        success: false,
        error: cuitValidation.errors?.join(', ')
      }
    }
    
    // Validate point of sale
    if (config.pointOfSale < 1 || config.pointOfSale > 9999) {
      return {
        success: false,
        error: 'El punto de venta debe estar entre 1 y 9999'
      }
    }
    
    const supabase = await createClient()
    
    // Upsert configuration (insert or update if exists)
    const { error } = await supabase
      .from('arca_configurations')
      .upsert({
        company_id: config.companyId,
        cuit: config.cuit,
        point_of_sale: config.pointOfSale,
        environment: config.environment,
        certificate_id: config.certificateId,
        last_sync: config.lastSync?.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      })
    
    if (error) {
      console.error('Error saving ARCA config:', error)
      return {
        success: false,
        error: 'Error al guardar la configuración de ARCA'
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in saveARCAConfig:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al guardar configuración'
    }
  }
}

/**
 * Retrieves ARCA configuration for a company
 * 
 * @param companyId - Company ID
 * @returns ARCA configuration or null if not found
 */
export async function getARCAConfig(
  companyId: string
): Promise<{ success: boolean; config?: ARCAConfig; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('arca_configurations')
      .select('*')
      .eq('company_id', companyId)
      .single()
    
    if (error || !data) {
      return {
        success: false,
        error: 'No se encontró configuración de ARCA para esta empresa'
      }
    }
    
    const config: ARCAConfig = {
      companyId: data.company_id,
      cuit: data.cuit,
      pointOfSale: data.point_of_sale,
      environment: data.environment,
      certificateId: data.certificate_id,
      lastSync: data.last_sync ? new Date(data.last_sync) : undefined
    }
    
    return {
      success: true,
      config
    }
  } catch (error) {
    console.error('Error in getARCAConfig:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener configuración'
    }
  }
}
