import type { InvoiceStatus } from '../model/status'

export const invoiceStatusLabelRu: Record<InvoiceStatus, string> = {
  NEW: 'Новый',
  SELECTED_FOR_PAYMENT: 'Выбран для оплаты',
  PAID: 'Оплачен',
}

export const invoiceStatusRowClassName: Record<InvoiceStatus, string> = {
  PAID: 'bg-emerald-50/60',
  SELECTED_FOR_PAYMENT: 'bg-sky-50/70',
  NEW: 'bg-transparent',
}

export const invoiceStatusSelectOptions = (
  Object.keys(invoiceStatusLabelRu) as InvoiceStatus[]
).map((status) => ({
  value: status,
  label: invoiceStatusLabelRu[status],
}))

