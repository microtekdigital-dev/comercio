'use server'

import axios, { AxiosInstance, AxiosError } from 'axios'
import {
  Certificate,
  AuthToken,
  InvoiceRequest,
  CAEResponse,
  InvoiceStatusResponse,
  CancelResponse,
  InvoiceType,
  Environment
} from '@/lib/types/arca'
import { getCertificate, getARCAConfig } from './configuration'

// ============================================================================
// Constants
// ============================================================================

const REQUEST_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3

// ============================================================================
// ARCA API Client Class
// ============================================================================

class ARCAAPIClient {
  private client: AxiosInstance
  private environment: Environment
  private authToken?: AuthToken

  constructor(environment: Environment = Environment.TESTING) {
    this.environment = environment
    
    const baseURL = environment === Environment.PRODUCTION
      ? process.env.ARCA_API_URL_PRODUCTION
      : process.env.ARCA_API_URL_TESTING
    
    this.client = axios.create({
      baseURL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Authenticates with ARCA using digital certificate
   * 
   * @param certificate - Digital certificate (.pfx)
   * @param privateKey - Private key password
   * @returns Authentication token
   */
  async authenticate(
    certificate: Certificate,
    privateKey: string
  ): Promise<{ success: boolean; token?: AuthToken; error?: string }> {
    try {
      // In a real implementation, this would:
      // 1. Load the .pfx certificate
      // 2. Sign a request with the private key
      // 3. Send to ARCA authentication endpoint
      // 4. Receive and store the token
      
      // For now, this is a placeholder that simulates the authentication
      const response = await this.client.post('/auth/login', {
        certificate: certificate.pfxData.toString('base64'),
        password: privateKey
      })
      
      const token: AuthToken = {
        token: response.data.token,
        expiresAt: new Date(response.data.expiresAt)
      }
      
      this.authToken = token
      
      return {
        success: true,
        token
      }
    } catch (error) {
      return this.handleError(error, 'Error al autenticar con ARCA')
    }
  }

  /**
   * Requests CAE (Código de Autorización Electrónico) for an invoice
   * 
   * @param invoice - Invoice request data
   * @returns CAE response with authorization code
   */
  async requestCAE(
    invoice: InvoiceRequest
  ): Promise<{ success: boolean; response?: CAEResponse; error?: string }> {
    try {
      // Ensure we have a valid token
      if (!this.authToken || this.isTokenExpired(this.authToken)) {
        return {
          success: false,
          error: 'Token de autenticación no válido o expirado. Por favor, autentique nuevamente.'
        }
      }
      
      // Prepare request payload according to ARCA specifications
      const payload = {
        Auth: {
          Token: this.authToken.token,
          Sign: '', // Would be calculated signature
          Cuit: invoice.customer.cuitCuil
        },
        FeCAEReq: {
          FeCabReq: {
            CantReg: 1,
            PtoVta: invoice.pointOfSale,
            CbteTipo: this.mapInvoiceTypeToCode(invoice.invoiceType)
          },
          FeDetReq: {
            FECAEDetRequest: [{
              Concepto: this.mapConceptToCode(invoice.concept),
              DocTipo: this.mapDocumentTypeToCode(invoice.customer.documentType),
              DocNro: invoice.customer.documentNumber,
              CbteDesde: invoice.invoiceNumber,
              CbteHasta: invoice.invoiceNumber,
              CbteFch: this.formatDate(invoice.issueDate),
              ImpTotal: this.calculateTotal(invoice.items),
              ImpTotConc: 0, // Non-taxable amount
              ImpNeto: this.calculateSubtotal(invoice.items),
              ImpOpEx: 0, // Exempt amount
              ImpIVA: this.calculateVAT(invoice.items),
              ImpTrib: 0, // Other taxes
              MonId: invoice.currency,
              MonCotiz: invoice.exchangeRate || 1,
              Iva: this.buildVATArray(invoice.items)
            }]
          }
        }
      }
      
      const response = await this.client.post('/wsfe/FECAESolicitar', payload, {
        headers: {
          'Authorization': `Bearer ${this.authToken.token}`
        }
      })
      
      // Parse ARCA response
      const result = response.data.FECAESolicitarResult
      
      if (result.Errors && result.Errors.length > 0) {
        return {
          success: false,
          error: result.Errors.map((e: any) => `${e.Code}: ${e.Msg}`).join(', ')
        }
      }
      
      const detResponse = result.FeDetResp.FECAEDetResponse[0]
      
      if (detResponse.Resultado === 'R') {
        // Rejected
        const errors = detResponse.Observaciones?.map((o: any) => `${o.Code}: ${o.Msg}`) || []
        return {
          success: false,
          response: {
            cae: '',
            caeExpirationDate: new Date(),
            invoiceNumber: invoice.invoiceNumber,
            success: false,
            errors
          }
        }
      }
      
      // Approved
      const caeResponse: CAEResponse = {
        cae: detResponse.CAE,
        caeExpirationDate: this.parseDate(detResponse.CAEFchVto),
        invoiceNumber: invoice.invoiceNumber,
        success: true
      }
      
      return {
        success: true,
        response: caeResponse
      }
    } catch (error) {
      return this.handleError(error, 'Error al solicitar CAE a ARCA')
    }
  }

  /**
   * Queries the status of an invoice in ARCA
   * 
   * @param cae - CAE code
   * @param invoiceNumber - Invoice number
   * @param pointOfSale - Point of sale number
   * @param invoiceType - Invoice type
   * @returns Invoice status
   */
  async queryInvoiceStatus(
    cae: string,
    invoiceNumber: number,
    pointOfSale: number,
    invoiceType: InvoiceType
  ): Promise<{ success: boolean; status?: InvoiceStatusResponse; error?: string }> {
    try {
      if (!this.authToken || this.isTokenExpired(this.authToken)) {
        return {
          success: false,
          error: 'Token de autenticación no válido o expirado'
        }
      }
      
      const payload = {
        Auth: {
          Token: this.authToken.token,
          Sign: '',
          Cuit: '' // Would come from config
        },
        PtoVta: pointOfSale,
        CbteTipo: this.mapInvoiceTypeToCode(invoiceType),
        CbteNro: invoiceNumber
      }
      
      const response = await this.client.post('/wsfe/FECompConsultar', payload, {
        headers: {
          'Authorization': `Bearer ${this.authToken.token}`
        }
      })
      
      const result = response.data.FECompConsultarResult
      
      if (result.Errors && result.Errors.length > 0) {
        return {
          success: false,
          error: result.Errors.map((e: any) => `${e.Code}: ${e.Msg}`).join(', ')
        }
      }
      
      const comprobante = result.ResultGet
      
      const status: InvoiceStatusResponse = {
        cae: comprobante.CodAutorizacion,
        authorized: comprobante.Resultado === 'A',
        authorizationDate: this.parseDate(comprobante.FchProceso),
        cancelled: comprobante.Anulado === 'S',
        cancellationDate: comprobante.FchAnulacion ? this.parseDate(comprobante.FchAnulacion) : undefined
      }
      
      return {
        success: true,
        status
      }
    } catch (error) {
      return this.handleError(error, 'Error al consultar estado del comprobante')
    }
  }

  /**
   * Cancels an invoice in ARCA
   * 
   * @param cae - CAE code
   * @param invoiceNumber - Invoice number
   * @param pointOfSale - Point of sale number
   * @param invoiceType - Invoice type
   * @returns Cancellation result
   */
  async cancelInvoice(
    cae: string,
    invoiceNumber: number,
    pointOfSale: number,
    invoiceType: InvoiceType
  ): Promise<{ success: boolean; response?: CancelResponse; error?: string }> {
    try {
      if (!this.authToken || this.isTokenExpired(this.authToken)) {
        return {
          success: false,
          error: 'Token de autenticación no válido o expirado'
        }
      }
      
      const payload = {
        Auth: {
          Token: this.authToken.token,
          Sign: '',
          Cuit: ''
        },
        PtoVta: pointOfSale,
        CbteTipo: this.mapInvoiceTypeToCode(invoiceType),
        CbteNro: invoiceNumber,
        CAE: cae
      }
      
      const response = await this.client.post('/wsfe/FECompAnular', payload, {
        headers: {
          'Authorization': `Bearer ${this.authToken.token}`
        }
      })
      
      const result = response.data.FECompAnularResult
      
      if (result.Errors && result.Errors.length > 0) {
        return {
          success: false,
          response: {
            success: false,
            errors: result.Errors.map((e: any) => `${e.Code}: ${e.Msg}`)
          }
        }
      }
      
      const cancelResponse: CancelResponse = {
        success: true,
        cancellationDate: new Date()
      }
      
      return {
        success: true,
        response: cancelResponse
      }
    } catch (error) {
      return this.handleError(error, 'Error al anular comprobante')
    }
  }

  /**
   * Gets the last authorized invoice number from ARCA
   * 
   * @param pointOfSale - Point of sale number
   * @param invoiceType - Invoice type
   * @returns Last authorized number
   */
  async getLastAuthorizedNumber(
    pointOfSale: number,
    invoiceType: InvoiceType
  ): Promise<{ success: boolean; number?: number; error?: string }> {
    try {
      if (!this.authToken || this.isTokenExpired(this.authToken)) {
        return {
          success: false,
          error: 'Token de autenticación no válido o expirado'
        }
      }
      
      const payload = {
        Auth: {
          Token: this.authToken.token,
          Sign: '',
          Cuit: ''
        },
        PtoVta: pointOfSale,
        CbteTipo: this.mapInvoiceTypeToCode(invoiceType)
      }
      
      const response = await this.client.post('/wsfe/FECompUltimoAutorizado', payload, {
        headers: {
          'Authorization': `Bearer ${this.authToken.token}`
        }
      })
      
      const result = response.data.FECompUltimoAutorizadoResult
      
      if (result.Errors && result.Errors.length > 0) {
        return {
          success: false,
          error: result.Errors.map((e: any) => `${e.Code}: ${e.Msg}`).join(', ')
        }
      }
      
      return {
        success: true,
        number: result.CbteNro
      }
    } catch (error) {
      return this.handleError(error, 'Error al obtener último número autorizado')
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private isTokenExpired(token: AuthToken): boolean {
    return new Date() >= token.expiresAt
  }

  private handleError(error: unknown, defaultMessage: string): { success: false; error: string } {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      
      if (axiosError.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Timeout: ARCA no respondió en 30 segundos. Por favor, intente nuevamente.'
        }
      }
      
      if (axiosError.response) {
        // Server responded with error
        const status = axiosError.response.status
        const data = axiosError.response.data as any
        
        if (status === 401) {
          return {
            success: false,
            error: 'No autorizado: El certificado digital fue rechazado por ARCA. Verifique la configuración.'
          }
        }
        
        if (status === 500) {
          return {
            success: false,
            error: 'Error interno de ARCA. Por favor, intente nuevamente más tarde.'
          }
        }
        
        return {
          success: false,
          error: data?.message || `Error ${status}: ${defaultMessage}`
        }
      }
      
      if (axiosError.request) {
        // Request made but no response
        return {
          success: false,
          error: 'No se pudo conectar con ARCA. Verifique su conexión a internet.'
        }
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : defaultMessage
    }
  }

  private mapInvoiceTypeToCode(invoiceType: InvoiceType): number {
    const mapping: Record<InvoiceType, number> = {
      [InvoiceType.FACTURA_A]: 1,
      [InvoiceType.FACTURA_B]: 6,
      [InvoiceType.FACTURA_C]: 11,
      [InvoiceType.NOTA_CREDITO_A]: 3,
      [InvoiceType.NOTA_CREDITO_B]: 8,
      [InvoiceType.NOTA_CREDITO_C]: 13,
      [InvoiceType.NOTA_DEBITO_A]: 2,
      [InvoiceType.NOTA_DEBITO_B]: 7,
      [InvoiceType.NOTA_DEBITO_C]: 12
    }
    return mapping[invoiceType]
  }

  private mapConceptToCode(concept: string): number {
    const mapping: Record<string, number> = {
      'PRODUCTS': 1,
      'SERVICES': 2,
      'PRODUCTS_AND_SERVICES': 3
    }
    return mapping[concept] || 1
  }

  private mapDocumentTypeToCode(documentType: string): number {
    const mapping: Record<string, number> = {
      'CUIT': 80,
      'CUIL': 86,
      'DNI': 96,
      'LE': 89,
      'LC': 90,
      'CI': 91,
      'PASAPORTE': 94
    }
    return mapping[documentType] || 96
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  private parseDate(dateStr: string): Date {
    // ARCA date format: YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1
    const day = parseInt(dateStr.substring(6, 8))
    return new Date(year, month, day)
  }

  private calculateTotal(items: any[]): number {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  private calculateSubtotal(items: any[]): number {
    return items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  private calculateVAT(items: any[]): number {
    return items.reduce((sum, item) => sum + item.vatAmount, 0)
  }

  private buildVATArray(items: any[]): any[] {
    // Group by VAT rate
    const vatMap = new Map<number, number>()
    
    for (const item of items) {
      const rate = item.vatRate
      const existing = vatMap.get(rate) || 0
      vatMap.set(rate, existing + item.vatAmount)
    }
    
    // Convert to ARCA format
    const vatArray: any[] = []
    vatMap.forEach((amount, rate) => {
      vatArray.push({
        Id: this.mapVATRateToId(rate),
        BaseImp: amount / (rate / 100),
        Importe: amount
      })
    })
    
    return vatArray
  }

  private mapVATRateToId(rate: number): number {
    const mapping: Record<number, number> = {
      21: 5,
      10.5: 4,
      27: 6,
      5: 8,
      2.5: 9,
      0: 3
    }
    return mapping[rate] || 5
  }
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Creates and authenticates an ARCA API client for a company
 * 
 * @param companyId - Company ID
 * @returns Authenticated API client or error
 */
export async function createARCAClient(
  companyId: string
): Promise<{ success: boolean; client?: ARCAAPIClient; error?: string }> {
  try {
    // Get company configuration
    const configResult = await getARCAConfig(companyId)
    if (!configResult.success || !configResult.config) {
      return {
        success: false,
        error: configResult.error || 'No se encontró configuración de ARCA'
      }
    }
    
    const config = configResult.config
    
    // Get certificate
    const certResult = await getCertificate(companyId)
    if (!certResult.success || !certResult.certificate) {
      return {
        success: false,
        error: certResult.error || 'No se encontró certificado digital'
      }
    }
    
    const certificate = certResult.certificate
    
    // Create client
    const client = new ARCAAPIClient(config.environment)
    
    // Authenticate
    const authResult = await client.authenticate(certificate, certificate.password)
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error
      }
    }
    
    return {
      success: true,
      client
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear cliente de ARCA'
    }
  }
}

export { ARCAAPIClient }
