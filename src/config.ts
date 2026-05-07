const getRequiredEnv = (key: string) => {
  const value = (import.meta.env as Record<string, unknown>)[key]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const API_BASE_URL = withoutTrailingSlash(getRequiredEnv('VITE_API_BASE_URL'))

export const UPLOADS_BASE_URL = withoutTrailingSlash(
  (import.meta.env.VITE_UPLOADS_BASE_URL as string | undefined) ?? `${API_BASE_URL}/uploads`,
)

