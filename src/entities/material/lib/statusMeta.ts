import type { DeliveryStatus } from '../model/status'

export const deliveryStatusLabelRu: Record<DeliveryStatus, string> = {
  NOT_DELIVERED: 'Не поставлено',
  PARTIALLY: 'Частично',
  DELIVERED: 'Поставлено',
}

export const deliveryStatusRowClassName: Record<DeliveryStatus, string> = {
  DELIVERED: 'bg-emerald-100/50 hover:bg-emerald-100/70',
  PARTIALLY: 'bg-amber-100/50 hover:bg-amber-100/70',
  NOT_DELIVERED: 'bg-rose-100/50 hover:bg-rose-100/70',
}

export const deliveryStatusSelectOptions = (
  Object.keys(deliveryStatusLabelRu) as DeliveryStatus[]
).map((status) => ({
  value: status,
  label: deliveryStatusLabelRu[status],
}))

