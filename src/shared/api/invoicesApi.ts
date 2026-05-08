import { httpClient } from './httpClient'
import { ApiError } from './httpClient'
import type { CreateInvoiceDto, UpdateInvoiceDto } from './contracts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const extractApiMessage = (value: unknown) => {
  if (!isRecord(value)) return null
  const message = value.message
  if (typeof message === 'string') return message
  if (isRecord(message) && typeof message.message === 'string') return message.message
  return null
}

const isUnexpectedFieldError = (error: unknown) => {
  if (!(error instanceof ApiError)) return false
  if (error.details.status !== 400) return false
  const message = extractApiMessage(error.details.responseBody)
  return Boolean(message && /Unexpected field/i.test(message))
}

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
    const primaryFieldName = options?.fieldName ?? 'pdfFile'

    const tryUpload = async (fieldName: string) => {
      const formData = new FormData()
      formData.append(fieldName, file)
      return httpClient.patchFormData<TResponse>(`/invoices/${invoiceId}/pdf-file`, formData)
    }

    try {
      return await tryUpload(primaryFieldName)
    } catch (e) {
      if (!isUnexpectedFieldError(e)) throw e

      const fallbackFieldName = primaryFieldName === 'pdfFile' ? 'file' : 'pdfFile'
      return await tryUpload(fallbackFieldName)
    }
  },
}

