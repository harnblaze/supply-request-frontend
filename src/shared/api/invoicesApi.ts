import { httpClient } from './httpClient'
import type { CreateInvoiceDto, UpdateInvoiceDto } from './contracts'

export const invoicesApi = {
  create: async <TResponse = unknown>(body: CreateInvoiceDto) =>
    httpClient.postJson<TResponse, CreateInvoiceDto>('/invoices', body),

  update: async <TResponse = unknown>(invoiceId: string, body: UpdateInvoiceDto) =>
    httpClient.patchJson<TResponse, UpdateInvoiceDto>(`/invoices/${invoiceId}`, body),

  selectForPayment: async <TResponse = unknown>(invoiceId: string) =>
    httpClient.patchJson<TResponse, Record<string, never>>(
      `/invoices/${invoiceId}/select-for-payment`,
      {},
    ),

  markPaid: async <TResponse = unknown>(invoiceId: string) =>
    httpClient.patchJson<TResponse, Record<string, never>>(`/invoices/${invoiceId}/mark-paid`, {}),

  uploadPdfFile: async <TResponse = unknown>(
    invoiceId: string,
    file: File,
    options?: { fieldName?: string },
  ) => {
    const formData = new FormData()
    formData.append(options?.fieldName ?? 'file', file)
    return httpClient.patchFormData<TResponse>(`/invoices/${invoiceId}/pdf-file`, formData)
  },
}

