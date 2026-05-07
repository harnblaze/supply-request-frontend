export const applicationStatuses = [
  'DRAFT',
  'SENT_TO_SUPPLY',
  'PAID',
  'PARTIALLY_DELIVERED',
  'FULLY_DELIVERED',
] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]

