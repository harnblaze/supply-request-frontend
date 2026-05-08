import type { ApplicationStatus } from '@/entities/application'
import type { ApplicationEditorEntity } from './applicationEditorTypes'

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

export const normalizeApplicationEditorEntity = (response: unknown): ApplicationEditorEntity | null => {
  if (!isRecord(response)) return null

  const id = response.id
  const status = response.status

  if (typeof id !== 'string') return null
  if (typeof status !== 'string') return null

  const wordFile = pickFirstString(response, ['wordFile', 'wordFilePath', 'wordFileUrl', 'wordFileName'])

  return {
    id,
    status: status as ApplicationStatus,
    applicationNumber: asStringOrNull(response.applicationNumber),
    comment: asStringOrNull(response.comment),
    wordFile,
  }
}

