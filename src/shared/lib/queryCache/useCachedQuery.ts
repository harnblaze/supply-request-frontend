import { useCallback, useEffect, useMemo } from 'react'

import { useQueryCacheStore, type QueryCacheEntry } from './queryCacheStore'

export interface UseCachedQueryResult<TData> {
  data: TData | undefined
  error: unknown
  isLoading: boolean
  status: QueryCacheEntry<TData>['status']
  updatedAt: number
  refetch: (options?: { force?: boolean }) => Promise<TData>
}

const defaultEntry: QueryCacheEntry = {
  status: 'idle',
  data: undefined,
  error: undefined,
  updatedAt: 0,
  inflight: undefined,
}

export const useCachedQuery = <TData,>(
  key: string | null,
  fetcher: (() => Promise<TData>) | null,
  options?: { ttlMs?: number; enabled?: boolean },
): UseCachedQueryResult<TData> => {
  const enabled = options?.enabled ?? true
  const ttlMs = options?.ttlMs

  const entry = useQueryCacheStore(
    useCallback((s) => (key ? (s.entries[key] as QueryCacheEntry<TData> | undefined) : undefined), [key]),
  )

  const safeEntry = (entry ?? defaultEntry) as QueryCacheEntry<TData>

  const refetch = useCallback(
    async (refetchOptions?: { force?: boolean }) => {
      if (!key || !fetcher) return Promise.reject(new Error('Query is disabled'))
      return useQueryCacheStore.getState().fetch(key, fetcher, { ttlMs, force: refetchOptions?.force })
    },
    [fetcher, key, ttlMs],
  )

  useEffect(() => {
    if (!enabled) return
    if (!key || !fetcher) return
    void useQueryCacheStore.getState().fetch(key, fetcher, { ttlMs })
  }, [enabled, fetcher, key, ttlMs])

  return useMemo(
    () => ({
      data: safeEntry.data,
      error: safeEntry.error,
      isLoading: safeEntry.status === 'loading' || safeEntry.status === 'idle',
      status: safeEntry.status,
      updatedAt: safeEntry.updatedAt,
      refetch,
    }),
    [refetch, safeEntry.data, safeEntry.error, safeEntry.status, safeEntry.updatedAt],
  )
}

