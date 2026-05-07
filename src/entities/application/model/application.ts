import type { ApplicationStatus } from './status'

export interface Application {
  id: string
  applicationNumber?: string | null
  createdAt?: string | null
  status: ApplicationStatus
}

