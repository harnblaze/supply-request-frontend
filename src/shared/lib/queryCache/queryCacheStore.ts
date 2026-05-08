import { create } from 'zustand'

export type QueryCacheStatus = 'idle' | 'loading' | 'success' | 'error'

export interface QueryCacheEntry<TData = unknown> {
  status: QueryCacheStatus
  data?: TData
  error?: unknown
  updatedAt: number
  inflight?: Promise<TData>
}

interface FetchOptions {
  ttlMs?: number
  force?: boolean
}

interface QueryCacheState {
  entries: Record<string, QueryCacheEntry>
  fetch: <TData>(key: string, fetcher: () => Promise<TData>, options?: FetchOptions) => Promise<TData>
  invalidateKey: (key: string) => void
  invalidatePrefix: (prefix: string) => void
  clear: () => void
}

const now = () => Date.now()

export const useQueryCacheStore = create<QueryCacheState>()((set, get) => ({
  entries: {},

  fetch: async <TData,>(key: string, fetcher: () => Promise<TData>, options?: FetchOptions) => {
    const ttlMs = options?.ttlMs ?? 30_000
    const force = options?.force ?? false

    const existing = get().entries[key] as QueryCacheEntry<TData> | undefined
    const isFresh = existing?.status === 'success' && now() - existing.updatedAt < ttlMs

    if (!force) {
      if (isFresh && existing?.data !== undefined) return existing.data
      if (existing?.inflight) return existing.inflight
    }

    const inflight = (async () => {
      const data = await fetcher()
      set((state) => {
        const current = state.entries[key] as QueryCacheEntry<TData> | undefined
        if (current?.inflight !== inflight) return state
        return {
          entries: {
            ...state.entries,
            [key]: {
              status: 'success',
              data,
              error: undefined,
              updatedAt: now(),
              inflight: undefined,
            },
          },
        }
      })
      return data
    })()

    set((state) => ({
      entries: {
        ...state.entries,
        [key]: {
          status: 'loading',
          data: force ? undefined : (state.entries[key]?.data as TData | undefined),
          error: undefined,
          updatedAt: state.entries[key]?.updatedAt ?? 0,
          inflight,
        },
      },
    }))

    try {
      return await inflight
    } catch (error) {
      set((state) => {
        const current = state.entries[key] as QueryCacheEntry<TData> | undefined
        if (current?.inflight !== inflight) return state
        return {
          entries: {
            ...state.entries,
            [key]: {
              status: 'error',
              data: undefined,
              error,
              updatedAt: current?.updatedAt ?? 0,
              inflight: undefined,
            },
          },
        }
      })
      throw error
    }
  },

  invalidateKey: (key: string) =>
    set((state) => {
      if (!(key in state.entries)) return state
      const next = { ...state.entries }
      delete next[key]
      return { entries: next }
    }),

  invalidatePrefix: (prefix: string) =>
    set((state) => {
      const keys = Object.keys(state.entries)
      const toDelete = keys.filter((k) => k.startsWith(prefix))
      if (toDelete.length === 0) return state
      const next = { ...state.entries }
      for (const k of toDelete) delete next[k]
      return { entries: next }
    }),

  clear: () => set({ entries: {} }),
}))

