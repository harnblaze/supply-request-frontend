import type { DeliveryStatus } from './status'

export interface Material {
  id: string
  applicationId: string | null
  name: string
  orderedQuantity: number
  deliveredQuantity: number
  deliveryStatus: DeliveryStatus
  deliveredAt: string | null
  createdAt: string | null
}

