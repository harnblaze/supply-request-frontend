import { z } from 'zod'

import { invoiceAmountSchema, invoicePdfFileSchema, invoiceSupplierSchema } from './invoiceFormSchema'

export const editInvoiceSchema = z.object({
  supplier: invoiceSupplierSchema,
  amount: invoiceAmountSchema,
  pdfFile: invoicePdfFileSchema.optional(),
})

export type EditInvoiceFormValues = z.infer<typeof editInvoiceSchema>

