import { applicationsApi, type CreateApplicationDto, type UpdateApplicationDto } from '@/shared/api'

export const applicationEditorApi = {
  create: async (body: CreateApplicationDto) => applicationsApi.create<unknown>(body),
  getById: async (id: string) => applicationsApi.getById<unknown>(id),
  update: async (id: string, body: UpdateApplicationDto) => applicationsApi.update<unknown>(id, body),
  uploadWordFile: async (applicationId: string, file: File) =>
    applicationsApi.uploadWordFile<unknown>(applicationId, file),
}

