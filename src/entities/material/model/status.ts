export const deliveryStatuses = ['NOT_DELIVERED', 'PARTIALLY', 'DELIVERED'] as const

export type DeliveryStatus = (typeof deliveryStatuses)[number]

