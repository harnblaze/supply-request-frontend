import type { UpdateApplicationStatus } from '@/shared/api'
import type { ApplicationStatus } from '@/entities/application'

export type ApplicationEditorMode = 'create' | 'edit'

export interface ApplicationEditorEntity {
  id: string
  applicationNumber: string | null
  status: ApplicationStatus
  comment: string | null
  wordFile: string | null
}

export const updateableApplicationStatuses: UpdateApplicationStatus[] = ['DRAFT', 'SENT_TO_SUPPLY']

