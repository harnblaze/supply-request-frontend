import type { Application, ApplicationStatus } from '@/entities/application'
import type { Invoice, InvoiceStatus } from '@/entities/invoice'
import type { Material } from '@/entities/material'

import { stableStringify, useCachedQuery, useQueryCacheStore } from '@/shared/lib'

import { applicationsApi } from './applicationsApi'
import type { ApplicationsListQuery, MaterialsListQuery } from './contracts'
import { materialsApi } from './materialsApi'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const asStringOrNull = (value: unknown) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  return String(value)
}

const pickFirstString = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) return value
  }
  return null
}

const normalizeApplicationListItem = (value: unknown): Application | null => {
  if (!isRecord(value)) return null
  const id = value.id
  const status = value.status
  if (typeof id !== 'string') return null
  if (typeof status !== 'string') return null

  return {
    id,
    status: status as ApplicationStatus,
    applicationNumber: asStringOrNull(value.applicationNumber),
    createdAt: asStringOrNull(value.createdAt),
    comment: asStringOrNull(value.comment),
  }
}

const normalizeApplicationsListResponse = (response: unknown): Application[] => {
  const rawItems = Array.isArray(response)
    ? response
    : isRecord(response) && Array.isArray(response.items)
      ? response.items
      : isRecord(response) && Array.isArray(response.data)
        ? response.data
        : []

  return rawItems.map(normalizeApplicationListItem).filter((item): item is Application => Boolean(item))
}

const normalizeApplicationDetailsResponse = (response: unknown): Application | null => {
  if (!isRecord(response)) return null

  const base = normalizeApplicationListItem(response)
  if (!base) return null

  const wordFile = pickFirstString(response, ['wordFile', 'wordFilePath', 'wordFileUrl', 'wordFileName'])
  return { ...base, wordFile }
}

const normalizeInvoice = (value: unknown): Invoice | null => {
  if (!isRecord(value)) return null

  const id = value.id
  const status = value.status
  if (typeof id !== 'string') return null
  if (typeof status !== 'string') return null

  const supplier = typeof value.supplier === 'string' ? value.supplier : ''
  const amount = typeof value.amount === 'string' ? value.amount : String(value.amount ?? '')
  const pdfFile = pickFirstString(value, ['pdfFile', 'pdfFilePath', 'pdfFileUrl', 'pdfFileName'])

  return {
    id,
    status: status as InvoiceStatus,
    supplier,
    amount,
    applicationId: asStringOrNull(value.applicationId),
    paidAt: asStringOrNull(value.paidAt),
    pdfFile,
    createdAt: asStringOrNull(value.createdAt),
  }
}

const normalizeInvoicesListResponse = (response: unknown): Invoice[] => {
  if (Array.isArray(response)) return response.map(normalizeInvoice).filter((v): v is Invoice => Boolean(v))
  if (isRecord(response) && Array.isArray(response.items)) {
    return response.items.map(normalizeInvoice).filter((v): v is Invoice => Boolean(v))
  }
  return []
}

const normalizeMaterial = (value: unknown): Material | null => {
  if (!isRecord(value)) return null

  const id = value.id
  const deliveryStatus = value.deliveryStatus
  if (typeof id !== 'string') return null
  if (typeof deliveryStatus !== 'string') return null

  const name = typeof value.name === 'string' ? value.name : ''
  const orderedQuantity =
    typeof value.orderedQuantity === 'number'
      ? value.orderedQuantity
      : typeof value.orderedQuantity === 'string'
        ? Number(value.orderedQuantity)
        : 0
  const deliveredQuantity =
    typeof value.deliveredQuantity === 'number'
      ? value.deliveredQuantity
      : typeof value.deliveredQuantity === 'string'
        ? Number(value.deliveredQuantity)
        : 0

  const deliveredAt = asStringOrNull(
    value.deliveredAt ?? value.deliveredDate ?? value.deliveryDate ?? value.deliveredOn ?? null,
  )

  return {
    id,
    deliveryStatus: deliveryStatus as Material['deliveryStatus'],
    name,
    orderedQuantity: Number.isFinite(orderedQuantity) ? orderedQuantity : 0,
    deliveredQuantity: Number.isFinite(deliveredQuantity) ? deliveredQuantity : 0,
    applicationId: asStringOrNull(value.applicationId),
    deliveredAt,
    createdAt: asStringOrNull(value.createdAt),
  }
}

const normalizeMaterialsByApplicationResponse = (response: unknown): Material[] => {
  if (Array.isArray(response)) return response.map(normalizeMaterial).filter((v): v is Material => Boolean(v))
  if (isRecord(response) && Array.isArray(response.items)) {
    return response.items.map(normalizeMaterial).filter((v): v is Material => Boolean(v))
  }
  return []
}

type MaterialsSearchItem = Material & {
  applicationNumber?: string | null
}

const normalizeMaterialSearchItem = (value: unknown): MaterialsSearchItem | null => {
  if (!isRecord(value)) return null

  const base = normalizeMaterial(value)
  if (!base) return null

  const application = isRecord(value.application) ? value.application : null
  const applicationId = asStringOrNull(value.applicationId ?? (application ? application.id : null))
  const applicationNumber = asStringOrNull(
    value.applicationNumber ?? (application ? application.applicationNumber : null),
  )

  return { ...base, applicationId, applicationNumber }
}

const normalizeMaterialsSearchResponse = (response: unknown): MaterialsSearchItem[] => {
  if (Array.isArray(response)) {
    return response
      .map(normalizeMaterialSearchItem)
      .filter((v): v is MaterialsSearchItem => Boolean(v))
  }
  if (isRecord(response) && Array.isArray(response.items)) {
    return response.items
      .map(normalizeMaterialSearchItem)
      .filter((v): v is MaterialsSearchItem => Boolean(v))
  }
  return []
}

const keyApplicationsList = (query?: ApplicationsListQuery) =>
  `applications:list?${stableStringify(query ?? {})}`
const keyApplicationById = (id: string) => `applications:byId:${id}`
const keyInvoicesByApplication = (applicationId: string) => `applications:${applicationId}:invoices`
const keyMaterialsByApplication = (applicationId: string) => `applications:${applicationId}:materials`
const keyMaterialsSearch = (query?: MaterialsListQuery) => `materials:list?${stableStringify(query ?? {})}`

export const applyOptimisticInvoicesUpdate = (
  applicationId: string,
  updater: (prev: Invoice[] | undefined) => Invoice[],
) => {
  useQueryCacheStore.getState().updateData(keyInvoicesByApplication(applicationId), updater)
}

export const applyOptimisticMaterialsByApplicationUpdate = (
  applicationId: string,
  updater: (prev: Material[] | undefined) => Material[],
) => {
  useQueryCacheStore.getState().updateData(keyMaterialsByApplication(applicationId), updater)
}

export const invalidateApplicationsList = () =>
  useQueryCacheStore.getState().invalidatePrefix('applications:list?')

export const invalidateApplication = (id: string) =>
  useQueryCacheStore.getState().invalidateKey(keyApplicationById(id))

export const invalidateInvoices = (applicationId: string) =>
  useQueryCacheStore.getState().invalidateKey(keyInvoicesByApplication(applicationId))

export const invalidateMaterialsByApplication = (applicationId: string) =>
  useQueryCacheStore.getState().invalidateKey(keyMaterialsByApplication(applicationId))

export const invalidateMaterialsSearch = () =>
  useQueryCacheStore.getState().invalidatePrefix('materials:list?')

export const invalidateApplicationAggregate = (applicationId: string) => {
  invalidateApplication(applicationId)
  invalidateInvoices(applicationId)
  invalidateMaterialsByApplication(applicationId)
  invalidateApplicationsList()
  invalidateMaterialsSearch()
}

export const useApplicationsList = (query?: ApplicationsListQuery) => {
  const key = keyApplicationsList(query)

  return useCachedQuery<Application[]>(
    key,
    async () => {
      const response = await applicationsApi.list<unknown>(query)
      const list = normalizeApplicationsListResponse(response)
      return [...list].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
    },
    { ttlMs: 20_000 },
  )
}

export const useApplication = (id: string | null) => {
  const key = id ? keyApplicationById(id) : null

  return useCachedQuery<Application | null>(
    key,
    id
      ? async () => {
          const response = await applicationsApi.getById<unknown>(id)
          return normalizeApplicationDetailsResponse(response)
        }
      : null,
    { ttlMs: 15_000, enabled: Boolean(id) },
  )
}

export const useInvoices = (applicationId: string | null) => {
  const key = applicationId ? keyInvoicesByApplication(applicationId) : null

  return useCachedQuery<Invoice[]>(
    key,
    applicationId
      ? async () => {
          const response = await applicationsApi.listInvoices<unknown>(applicationId)
          return normalizeInvoicesListResponse(response)
        }
      : null,
    { ttlMs: 15_000, enabled: Boolean(applicationId) },
  )
}

export const useMaterialsByApplication = (applicationId: string | null) => {
  const key = applicationId ? keyMaterialsByApplication(applicationId) : null

  return useCachedQuery<Material[]>(
    key,
    applicationId
      ? async () => {
          const response = await applicationsApi.listMaterials<unknown>(applicationId)
          return normalizeMaterialsByApplicationResponse(response)
        }
      : null,
    { ttlMs: 15_000, enabled: Boolean(applicationId) },
  )
}

export const useMaterialsSearch = (query?: MaterialsListQuery) => {
  const key = keyMaterialsSearch(query)

  return useCachedQuery<MaterialsSearchItem[]>(
    key,
    async () => {
      const response = await materialsApi.list<unknown>(query)
      return normalizeMaterialsSearchResponse(response)
    },
    { ttlMs: 20_000 },
  )
}

