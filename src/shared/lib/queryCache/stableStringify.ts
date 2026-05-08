type JsonLike =
  | null
  | boolean
  | number
  | string
  | JsonLike[]
  | { [key: string]: JsonLike | undefined }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalize = (value: unknown): JsonLike => {
  if (value === undefined) return null
  if (value === null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value

  if (Array.isArray(value)) return value.map(normalize)

  if (isRecord(value)) {
    const keys = Object.keys(value).sort()
    const out: Record<string, JsonLike> = {}
    for (const key of keys) {
      const v = value[key]
      if (v === undefined) continue
      out[key] = normalize(v)
    }
    return out
  }

  return String(value)
}

export const stableStringify = (value: unknown) => JSON.stringify(normalize(value))

