import { httpClient } from './httpClient'
import type {
  CreateMaterialDto,
  MaterialsListQuery,
  UpdateMaterialDto,
} from './contracts'

export const materialsApi = {
  list: async <TResponse = unknown>(query?: MaterialsListQuery) =>
    httpClient.getJson<TResponse>('/materials', { query }),

  create: async <TResponse = unknown>(body: CreateMaterialDto) =>
    httpClient.postJson<TResponse, CreateMaterialDto>('/materials', body),

  update: async <TResponse = unknown>(materialId: string, body: UpdateMaterialDto) =>
    httpClient.patchJson<TResponse, UpdateMaterialDto>(`/materials/${materialId}`, body),
}

