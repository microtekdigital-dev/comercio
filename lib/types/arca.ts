// Types for ARCA Electronic Invoicing System (Argentina)

// ============================================================================
// Enums
// ============================================================================

export enum InvoiceType {
  FACTURA_A = 'FACTURA_A',
  FACTURA_B = 'FACTURA_B',
  FACTURA_C = 'FACTURA_C',
  NOTA_CREDITO_A = 'NOTA_CREDITO_A',
  NOTA_CREDITO_B = 'NOTA_CREDITO_B',
  NOTA_CREDITO_C = 'NOTA_CREDITO_C',
  NOTA_DEBITO_A = 'NOTA_DEBITO_A',
  NOTA_DEBITO_B = 'NOTA_DEBITO_B',
  NOTA_DEBITO_C = 'NOTA_DEBITO_C'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum InvoiceConcept {
  PRODUCTS = 'PRODUCTS',
  SERVICES = 'SERVICES',
  PRODUCTS_AND_SERVICES = 'PRODUCTS_AND_SERVICES'
}

export enum FiscalCondition {
  RESPONSABLE_INSCRIPTO = 'RESPONSABLE_INSCRIPTO',
  CONSUMIDOR_FINAL = 'CONSUMIDOR_FINAL',
  MONOTRIBUTISTA = 'MONOTRIBUTISTA',
  EXENTO = 'EXENTO'
}

export enum VATRate {
  VAT_21 = 21,
  VAT_10_5 = 10.5,
  VAT_27 = 27,
  VAT_5 = 5,
  VAT_2_5 = 2.5,
  VAT_0 = 0
}

export enum Environment {
  TESTING = 'TESTING',
  PRODUCTION = 'PRODUCTION'
}

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  AUTHORIZE = 'AUTHORIZE',
  CANCEL = 'CANCEL',
  QUERY = 'QUERY',
  SYNC = 'SYNC',
  RETRY = 'RETRY'
}

export enum EntityType {
  INVOICE = 'INVOICE',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  CERTIFICATE = 'CERTIFICATE',
  CONFIGURATION = 'CONFIGURATION'
}

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV'
}

// ============================================================================
// Core Interfaces
// ============================================================================

export interface Certificate {
  pfxData: Buffer
  password: string
}

export interface AuthToken {
  token: string
  expiresAt: Date
}

export interface ARCAConfig {
  companyId: string
  cuit: string
  pointOfSale: number
  environment: Environment
  certificateId: string
  lastSync?: Date
}

export interface ValidationResult {
  valid: boolean
  errors?: string[]
  expirationDate?: Date
}

// ============================================================================
// Customer and Invoice Data
// ============================================================================

export interface CustomerFiscalData {
  cuitCuil?: string
  documentType: string
  documentNumber: string
  fiscalCondition: FiscalCondition
  businessName: string
  fiscalAddress: string
}

export interface InvoiceItem {
  productId: string
  description: string
  quantity: number
  unitPrice: number
  vatRate: VATRate
  subtotal: number
  vatAmount: number
  total: number
}

export interface VATBreakdown {
  rate: VATRate
  taxableBase: number
  vatAmount: number
}

export interface ElectronicInvoice {
  id: string
  companyId: string
  saleId?: string
  invoiceType: InvoiceType
  pointOfSale: number
  invoiceNumber: number
  issueDate: Date
  customer: CustomerFiscalData
  items: InvoiceItem[]
  concept: InvoiceConcept
  currency: string
  exchangeRate?: number
  subtotal: number
  vatAmount: number
  total: number
  status: InvoiceStatus
  cae?: string
  caeExpirationDate?: Date
  qrCode?: string
  pdfUrl?: string
  relatedInvoiceId?: string
  createdBy: string
  createdAt: Date
}

// ============================================================================
// ARCA API Interfaces
// ============================================================================

export interface InvoiceRequest {
  pointOfSale: number
  invoiceType: InvoiceType
  invoiceNumber: number
  issueDate: Date
  customer: CustomerFiscalData
  items: InvoiceItem[]
  concept: InvoiceConcept
  currency: string
  exchangeRate?: number
}

export interface CAEResponse {
  cae: string
  caeExpirationDate: Date
  invoiceNumber: number
  success: boolean
  errors?: string[]
}

export interface InvoiceStatusResponse {
  cae: string
  authorized: boolean
  authorizationDate: Date
  cancelled: boolean
  cancellationDate?: Date
}

export interface CancelResponse {
  success: boolean
  cancellationDate?: Date
  errors?: string[]
}

// ============================================================================
// Processing Results
// ============================================================================

export interface ProcessResult {
  success: boolean
  invoiceId: string
  cae?: string
  caeExpirationDate?: Date
  errors?: string[]
  retryable: boolean
}

export interface CancelResult {
  success: boolean
  invoiceId: string
  cancellationDate?: Date
  errors?: string[]
}

export interface RetryResult {
  invoiceId: string
  attemptNumber: number
  success: boolean
  nextRetryAt?: Date
}

// ============================================================================
// Sequence Management
// ============================================================================

export interface SequenceValidation {
  valid: boolean
  expectedNext: number
  actualNext: number
  gaps: number[]
}

// ============================================================================
// Audit and Logging
// ============================================================================

export interface AuditOperation {
  companyId: string
  userId: string
  operationType: OperationType
  entityType: EntityType
  entityId: string
  timestamp: Date
  details: Record<string, any>
  success: boolean
  errorMessage?: string
}

export interface AuditLog {
  id: string
  operation: AuditOperation
  createdAt: Date
}

export interface LogFilters {
  companyId: string
  startDate?: Date
  endDate?: Date
  operationType?: OperationType
  entityType?: EntityType
  userId?: string
}

// ============================================================================
// Reports
// ============================================================================

export interface ReportFilters {
  companyId: string
  startDate: Date
  endDate: Date
  invoiceType?: InvoiceType
  pointOfSale?: number
  status?: InvoiceStatus
}

export interface IssuedInvoicesReport {
  filters: ReportFilters
  invoices: ElectronicInvoice[]
  totalCount: number
  totalAmount: number
  vatBreakdown: VATBreakdown[]
  successRate: number
}

export interface TypeBreakdown {
  invoiceType: InvoiceType
  count: number
  totalAmount: number
}

export interface ByTypeReport {
  filters: ReportFilters
  breakdown: TypeBreakdown[]
  totalAmount: number
}

export interface CancelledInvoice {
  invoice: ElectronicInvoice
  cancellationDate: Date
  cancellationReason: string
  cancelledBy: string
}

export interface CancelledReport {
  filters: ReportFilters
  cancelledInvoices: CancelledInvoice[]
  totalCount: number
}

export interface InvoiceError {
  invoiceId: string
  errorType: string
  errorMessage: string
  attemptCount: number
  lastAttempt: Date
}

export interface ErrorBreakdown {
  errorType: string
  count: number
  percentage: number
}

export interface ErrorReport {
  filters: ReportFilters
  errors: InvoiceError[]
  errorsByType: ErrorBreakdown[]
}

// ============================================================================
// PDF Generation
// ============================================================================

export interface PDFDocument {
  buffer: Buffer
  filename: string
  mimeType: string
}

export interface PDFLayout {
  header: HeaderSection
  customerData: CustomerSection
  items: ItemsSection
  totals: TotalsSection
  fiscalData: FiscalSection
  qrCode: QRSection
}

export interface HeaderSection {
  companyName: string
  companyAddress: string
  companyCuit: string
  invoiceType: string
  pointOfSale: number
  invoiceNumber: number
  issueDate: string
}

export interface CustomerSection {
  businessName: string
  cuitCuil?: string
  documentType: string
  documentNumber: string
  fiscalCondition: string
  fiscalAddress: string
}

export interface ItemsSection {
  items: InvoiceItem[]
}

export interface TotalsSection {
  subtotal: number
  vatAmount: number
  total: number
  vatBreakdown: VATBreakdown[]
}

export interface FiscalSection {
  cae: string
  caeExpirationDate: string
  concept: string
  currency: string
  exchangeRate?: number
}

export interface QRSection {
  qrCode: string
  qrData: string
}
