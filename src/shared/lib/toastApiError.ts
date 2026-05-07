import { toast } from 'sonner'

import { ApiError } from '@/shared/api'

type UnknownError = unknown

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getApiMessageFromBody = (value: unknown) => {
  if (!isRecord(value)) return null
  const message = value.message
  if (typeof message === 'string' && message.trim().length > 0) return message
  return null
}

export const toastApiError = (
  error: UnknownError,
  options?: {
    title?: string
    fallbackMessage?: string
  },
) => {
  const title = options?.title ?? 'Ошибка'
  const fallbackMessage = options?.fallbackMessage ?? 'Что-то пошло не так.'

  if (error instanceof ApiError) {
    const apiMessage = getApiMessageFromBody(error.details.responseBody)
    const description = apiMessage ?? error.message ?? fallbackMessage

    toast.error(title, {
      description,
    })
    return
  }

  if (error instanceof Error) {
    toast.error(title, {
      description: error.message || fallbackMessage,
    })
    return
  }

  toast.error(title, {
    description: fallbackMessage,
  })
}

