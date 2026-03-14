# ARCA UI Components

This directory contains React components for the ARCA electronic invoicing interface.

## Components

- `arca-configuration.tsx` - Configuration form for certificates and credentials
- `generate-invoice-modal.tsx` - Modal for generating invoices from sales
- `invoice-status-badge.tsx` - Status badge component
- `generate-credit-note-modal.tsx` - Modal for credit notes
- `generate-debit-note-modal.tsx` - Modal for debit notes

## Pages

Pages are located in `app/dashboard/arca/`:
- `invoices/page.tsx` - Invoice listing
- `invoices/[id]/page.tsx` - Invoice detail
- `reports/page.tsx` - Reports
- `audit-logs/page.tsx` - Audit logs

## Usage

These components integrate with the ARCA backend services in `lib/actions/arca/`.
