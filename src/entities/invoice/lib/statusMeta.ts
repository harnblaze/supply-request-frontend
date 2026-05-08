import type { InvoiceStatus } from '../model/status'

export const invoiceStatusLabelRu: Record<InvoiceStatus, string> = {
  NEW: 'Новый',
  SELECTED_FOR_PAYMENT: 'Выбран для оплаты',
  PAID: 'Оплачен',
}

export const invoiceStatusRowClassName: Record<InvoiceStatus, string> = {
  PAID: 'bg-emerald-100/50 hover:bg-emerald-100/70',
  SELECTED_FOR_PAYMENT: 'bg-sky-100/50 hover:bg-sky-100/70',
  NEW: 'bg-transparent hover:bg-muted/50',
}

export const invoiceStatusSelectOptions = (
  Object.keys(invoiceStatusLabelRu) as InvoiceStatus[]
).map((status) => ({
  value: status,
  label: invoiceStatusLabelRu[status],
}))

