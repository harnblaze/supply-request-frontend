import type { ApplicationStatus } from '@/entities/application'

export interface PaginationQuery {
  page?: number
  limit?: number
}

export interface ApplicationsListQuery extends PaginationQuery {
  applicationNumber?: string
  status?: ApplicationStatus
}

export interface CreateApplicationDto {
  applicationNumber?: string
  comment?: string
}

export type UpdateApplicationStatus = 'DRAFT' | 'SENT_TO_SUPPLY'

export interface UpdateApplicationDto {
  applicationNumber?: string
  status?: UpdateApplicationStatus
  comment?: string
}

export interface CreateInvoiceDto {
  applicationId: string
  supplier: string
  amount: string
}

export interface UpdateInvoiceDto {
  supplier?: string
  amount?: string
}

export interface MaterialsListQuery extends PaginationQuery {
  name?: string
  applicationNumber?: string
}

export interface CreateMaterialDto {
  applicationId: string
  name: string
  orderedQuantity: number
  deliveredQuantity?: number
}

export interface UpdateMaterialDto {
  deliveredQuantity?: number
}

