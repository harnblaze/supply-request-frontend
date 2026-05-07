export const invoiceStatuses = ['NEW', 'SELECTED_FOR_PAYMENT', 'PAID'] as const

export type InvoiceStatus = (typeof invoiceStatuses)[number]

