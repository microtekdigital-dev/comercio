# ARCA Electronic Invoicing Module

This directory contains the implementation of the ARCA (Argentina) electronic invoicing system.

## Structure

- `configuration.ts` - Certificate and credentials management
- `sequences.ts` - Invoice numbering sequence management
- `invoice-generator.ts` - Invoice generation from sales
- `api-client.ts` - ARCA API communication
- `retry-manager.ts` - Retry logic with exponential backoff
- `invoice-processor.ts` - Invoice processing and state management
- `audit-logger.ts` - Audit logging for all operations
- `report-generator.ts` - Report generation
- `pdf-generator.ts` - PDF generation with QR codes
- `error-handler.ts` - Error handling and circuit breaker

## Environment Variables

Required environment variables (see `.env.example`):
- `ARCA_API_URL_TESTING` - ARCA testing environment URL
- `ARCA_API_URL_PRODUCTION` - ARCA production environment URL
- `ARCA_TIMEOUT_MS` - API timeout in milliseconds (default: 30000)

## Usage

See the main documentation in `.kiro/specs/facturacion-electronica-arca/` for detailed requirements, design, and implementation tasks.
