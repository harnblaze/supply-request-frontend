import { API_BASE_URL } from '@/config'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface ApiErrorDetails {
  status: number
  url: string
  method: HttpMethod
  responseBody?: unknown
}

export class ApiError extends Error {
  public readonly details: ApiErrorDetails

  public constructor(message: string, details: ApiErrorDetails) {
    super(message)
    this.name = 'ApiError'
    this.details = details
  }
}

type QueryPrimitive = string | number | boolean | null | undefined
export type QueryParams = object

const isQueryPrimitive = (value: unknown): value is QueryPrimitive =>
  value === null ||
  value === undefined ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'

const buildUrl = (path: string, query?: QueryParams) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalizedPath}`)

  if (!query) return url.toString()

  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (!isQueryPrimitive(value)) return
    if (value === undefined || value === null) return
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

const readBodySafely = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as unknown
    } catch {
      return undefined
    }
  }

  try {
    return await response.text()
  } catch {
    return undefined
  }
}

export interface HttpClientOptions {
  timeoutMs?: number
}

export interface JsonRequestOptions extends HttpClientOptions {
  query?: QueryParams
  headers?: HeadersInit
}

const DEFAULT_TIMEOUT_MS = 15_000

const request = async <TResponse>(args: {
  method: HttpMethod
  path: string
  query?: QueryParams
  headers?: HeadersInit
  body?: BodyInit | null
  timeoutMs?: number
}): Promise<TResponse> => {
  const timeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  const url = buildUrl(args.path, args.query)

  try {
    const response = await fetch(url, {
      method: args.method,
      headers: args.headers,
      body: args.body,
      signal: controller.signal,
    })

    if (!response.ok) {
      const responseBody = await readBodySafely(response)
      throw new ApiError(`API request failed: ${response.status}`, {
        status: response.status,
        url,
        method: args.method,
        responseBody,
      })
    }

    const responseBody = await readBodySafely(response)
    return responseBody as TResponse
  } catch (error) {
    if (error instanceof ApiError) throw error

    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? `API request timed out after ${timeoutMs}ms`
          : error.message
        : 'Unknown API error'

    throw new ApiError(message, {
      status: 0,
      url,
      method: args.method,
    })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const httpClient = {
  getJson: async <TResponse>(path: string, options?: JsonRequestOptions) =>
    request<TResponse>({
      method: 'GET',
      path,
      query: options?.query,
      headers: options?.headers,
      timeoutMs: options?.timeoutMs,
    }),

  postJson: async <TResponse, TBody extends object>(
    path: string,
    body: TBody,
    options?: JsonRequestOptions,
  ) =>
    request<TResponse>({
      method: 'POST',
      path,
      query: options?.query,
      headers: {
        'content-type': 'application/json',
        ...(options?.headers ?? {}),
      },
      body: JSON.stringify(body),
      timeoutMs: options?.timeoutMs,
    }),

  patchJson: async <TResponse, TBody extends object>(
    path: string,
    body: TBody,
    options?: JsonRequestOptions,
  ) =>
    request<TResponse>({
      method: 'PATCH',
      path,
      query: options?.query,
      headers: {
        'content-type': 'application/json',
        ...(options?.headers ?? {}),
      },
      body: JSON.stringify(body),
      timeoutMs: options?.timeoutMs,
    }),

  patchFormData: async <TResponse>(
    path: string,
    formData: FormData,
    options?: JsonRequestOptions,
  ) =>
    request<TResponse>({
      method: 'PATCH',
      path,
      query: options?.query,
      headers: options?.headers,
      body: formData,
      timeoutMs: options?.timeoutMs,
    }),
}

