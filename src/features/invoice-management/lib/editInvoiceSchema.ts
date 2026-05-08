import { z } from 'zod'

import { invoiceAmountSchema, invoiceSupplierSchema } from './invoiceFormSchema'

export const editInvoiceSchema = z.object({
  supplier: invoiceSupplierSchema,
  amount: invoiceAmountSchema,
})

export type EditInvoiceFormValues = z.infer<typeof editInvoiceSchema>

