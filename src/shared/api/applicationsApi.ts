import { httpClient } from './httpClient'
import type {
  ApplicationsListQuery,
  CreateApplicationDto,
  UpdateApplicationDto,
} from './contracts'

export const applicationsApi = {
  list: async <TResponse = unknown>(query?: ApplicationsListQuery) =>
    httpClient.getJson<TResponse>('/applications', { query }),

  create: async <TResponse = unknown>(body: CreateApplicationDto) =>
    httpClient.postJson<TResponse, CreateApplicationDto>('/applications', body),

  getById: async <TResponse = unknown>(id: string) =>
    httpClient.getJson<TResponse>(`/applications/${id}`),

  update: async <TResponse = unknown>(id: string, body: UpdateApplicationDto) =>
    httpClient.patchJson<TResponse, UpdateApplicationDto>(`/applications/${id}`, body),

  listInvoices: async <TResponse = unknown>(applicationId: string) =>
    httpClient.getJson<TResponse>(`/applications/${applicationId}/invoices`),

  listMaterials: async <TResponse = unknown>(applicationId: string) =>
    httpClient.getJson<TResponse>(`/applications/${applicationId}/materials`),

  uploadWordFile: async <TResponse = unknown>(
    applicationId: string,
    file: File,
    options?: { fieldName?: string },
  ) => {
    const formData = new FormData()
    formData.append(options?.fieldName ?? 'wordFile', file)
    return httpClient.patchFormData<TResponse>(`/applications/${applicationId}/word-file`, formData)
  },
}

