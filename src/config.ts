const getRequiredEnv = (key: string, fallback?: string) => {
  const value = (import.meta.env as Record<string, unknown>)[key]
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (normalized.length > 0) return normalized

  // Для локальной разработки допускаем дефолт, чтобы приложение запускалось "из коробки".
  // В prod build всё равно валимся, если конфиг не задан.
  if (import.meta.env.DEV && fallback) return fallback

  throw new Error(`Missing required env var: ${key}`)
}

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const API_BASE_URL = withoutTrailingSlash(
  getRequiredEnv('VITE_API_BASE_URL', 'http://localhost:3000/api'),
)

export const UPLOADS_BASE_URL = withoutTrailingSlash(
  (import.meta.env.VITE_UPLOADS_BASE_URL as string | undefined) ?? `${API_BASE_URL}/uploads`,
)

