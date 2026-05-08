import { z } from 'zod'

import { invoiceAmountSchema, invoicePdfFileSchema, invoiceSupplierSchema } from './invoiceFormSchema'

export const addInvoiceSchema = z.object({
  supplier: invoiceSupplierSchema,
  amount: invoiceAmountSchema,
  pdfFile: invoicePdfFileSchema.optional(),
})

export type AddInvoiceFormValues = z.infer<typeof addInvoiceSchema>

