import type { InvoiceStatus } from './status'

export interface Invoice {
  id: string
  applicationId?: string | null
  supplier: string
  amount: string
  status: InvoiceStatus
  paidAt?: string | null
  pdfFile?: string | null
  createdAt?: string | null
}

