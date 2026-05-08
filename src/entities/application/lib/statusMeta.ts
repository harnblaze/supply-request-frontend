import type { ApplicationStatus } from '../model/status'

export const applicationStatusLabelRu: Record<ApplicationStatus, string> = {
  DRAFT: 'Черновик',
  SENT_TO_SUPPLY: 'Отправлено в снабжение',
  PAID: 'Оплачено',
  PARTIALLY_DELIVERED: 'Частично поставлено',
  FULLY_DELIVERED: 'Полностью поставлено',
}

export const applicationStatusRowClassName: Record<ApplicationStatus, string> = {
  FULLY_DELIVERED: 'bg-emerald-100/50 hover:bg-emerald-100/70',
  PARTIALLY_DELIVERED: 'bg-amber-100/50 hover:bg-amber-100/70',
  PAID: 'bg-sky-100/50 hover:bg-sky-100/70',
  DRAFT: 'bg-muted/30 hover:bg-muted/50',
  SENT_TO_SUPPLY: 'bg-violet-100/50 hover:bg-violet-100/70',
}

export const applicationStatusSelectOptions = (
  Object.keys(applicationStatusLabelRu) as ApplicationStatus[]
).map((status) => ({
  value: status,
  label: applicationStatusLabelRu[status],
}))

