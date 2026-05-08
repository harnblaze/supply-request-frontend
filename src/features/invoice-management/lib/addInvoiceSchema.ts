import { z } from 'zod'

const MAX_PDF_FILE_SIZE_BYTES = 20 * 1024 * 1024

import { invoiceAmountSchema, invoiceSupplierSchema } from './invoiceFormSchema'

const pdfFileSchema = z
  .custom<File | null | undefined>((value) => value === null || value === undefined || value instanceof File)
  .refine((file) => !file || /\.pdf$/i.test(file.name), {
    message: 'Поддерживаются только файлы .pdf',
  })
  .refine((file) => !file || file.size <= MAX_PDF_FILE_SIZE_BYTES, {
    message: 'Файл слишком большой (макс. 20 МБ)',
  })

export const addInvoiceSchema = z.object({
  supplier: invoiceSupplierSchema,
  amount: invoiceAmountSchema,
  pdfFile: pdfFileSchema.optional(),
})

export type AddInvoiceFormValues = z.infer<typeof addInvoiceSchema>

