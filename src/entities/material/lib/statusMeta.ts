import type { DeliveryStatus } from '../model/status'

export const deliveryStatusLabelRu: Record<DeliveryStatus, string> = {
  NOT_DELIVERED: 'Не поставлено',
  PARTIALLY: 'Частично',
  DELIVERED: 'Поставлено',
}

export const deliveryStatusRowClassName: Record<DeliveryStatus, string> = {
  DELIVERED: 'bg-emerald-50/60',
  PARTIALLY: 'bg-amber-50/70',
  NOT_DELIVERED: 'bg-rose-50/60',
}

export const deliveryStatusSelectOptions = (
  Object.keys(deliveryStatusLabelRu) as DeliveryStatus[]
).map((status) => ({
  value: status,
  label: deliveryStatusLabelRu[status],
}))

