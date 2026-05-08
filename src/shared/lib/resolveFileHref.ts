import { API_BASE_URL, UPLOADS_BASE_URL } from '@/config'

const removeLeadingSlashes = (value: string) => value.replace(/^\/+/, '')

/**
 * Приводит строку файла из API к полноценному URL:
 * - `https?://...` → как есть
 * - `/uploads/...` (или любой абсолютный путь `/...`) → `${API_BASE_URL}${path}`
 * - `some/relative/path.ext` → `${UPLOADS_BASE_URL}/${path}`
 */
export const resolveFileHref = (file: string | null | undefined) => {
  if (!file) return null

  const trimmed = file.trim()
  if (trimmed.length === 0) return null

  if (/^https?:\/\//i.test(trimmed)) return trimmed

  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`
  }

  return `${UPLOADS_BASE_URL}/${removeLeadingSlashes(trimmed)}`
}

