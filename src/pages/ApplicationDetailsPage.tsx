import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { Application, ApplicationStatus } from '@/entities/application'
import { applicationStatusLabelRu } from '@/entities/application'
import { applicationsApi } from '@/shared/api'
import { API_BASE_URL, UPLOADS_BASE_URL } from '@/config'
import { formatDateTimeRu, toastApiError, toastSuccess } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/emptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { updateableApplicationStatuses } from '@/features/application-editor/lib/applicationEditorTypes'

export const ApplicationDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const refetch = useCallback(() => {
    setReloadToken((v) => v + 1)
  }, [])

  useEffect(() => {
    if (!id) return
    let isCancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await applicationsApi.getById<unknown>(id)
        const normalized = normalizeApplicationDetailsResponse(response)

        if (isCancelled) return
        setApplication(normalized)
      } catch (e) {
        if (isCancelled) return
        setError(e)
        toastApiError(e, { title: 'Не удалось загрузить заявку' })
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [id, reloadToken])

  const wordFileHref = useMemo(() => resolveWordFileHref(application?.wordFile ?? null), [
    application?.wordFile,
  ])

  const isStatusEditable = useMemo(() => {
    if (!application) return false
    return updateableApplicationStatuses.includes(application.status as never)
  }, [application])

  if (!id) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Детали заявки</h1>
          <p className="text-sm text-muted-foreground">Некорректный идентификатор заявки.</p>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Детали заявки</h1>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </div>
        <EmptyState
          title="Не удалось загрузить заявку"
          description="Проверь API и попробуй ещё раз."
          action={
            <Button type="button" onClick={refetch}>
              Перезагрузить
            </Button>
          }
        />
      </section>
    )
  }

  if (!application) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Детали заявки</h1>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </div>
        <EmptyState
          title="Заявка не найдена"
          description="Возможно, её удалили или неверный ID."
          action={
            <Button type="button" variant="secondary" onClick={() => navigate('/')}>
              К списку заявок
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {application.applicationNumber && application.applicationNumber.trim().length > 0
              ? `Заявка ${application.applicationNumber}`
              : 'Детали заявки'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>ID: {application.id}</span>
            <span aria-hidden="true">•</span>
            <span>Создана: {formatDateTimeRu(application.createdAt ?? null)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isStatusEditable ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                {applicationStatusLabelRu[application.status]}
              </Badge>
              <Select
                value={application.status}
                onValueChange={async (next) => {
                  if (!id) return
                  if (!updateableApplicationStatuses.includes(next as never)) return
                  if (next === application.status) return

                  setIsUpdatingStatus(true)
                  try {
                    await applicationsApi.update(id, { status: next as 'DRAFT' | 'SENT_TO_SUPPLY' })
                    toastSuccess('Статус заявки обновлён')
                    refetch()
                  } catch (e) {
                    toastApiError(e, { title: 'Не удалось обновить статус' })
                  } finally {
                    setIsUpdatingStatus(false)
                  }
                }}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-[220px]" aria-label="Изменить статус заявки">
                  <SelectValue>{applicationStatusLabelRu[application.status]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {updateableApplicationStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {applicationStatusLabelRu[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {applicationStatusLabelRu[application.status]}
            </Badge>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/applications/${application.id}/edit`)}
            aria-label="Редактировать заявку"
          >
            Редактировать
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Комментарий</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {application.comment && application.comment.trim().length > 0 ? application.comment : '—'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Word</p>
            {wordFileHref ? (
              <a
                className="text-sm font-medium text-primary underline underline-offset-4 hover:opacity-90"
                href={wordFileHref}
                target="_blank"
                rel="noreferrer"
                aria-label="Открыть Word файл заявки"
              >
                Открыть / скачать
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Счета</TabsTrigger>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Таблица счетов будет добавлена в шаге 7. После действий тут будет вызываться refetch заявки,
              чтобы поймать серверные автопереходы статусов.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="materials" className="mt-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Таблица материалов будет добавлена в шаге 8. После изменений количества поставки тут будет
              вызываться refetch заявки и списка материалов.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}

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

const normalizeApplicationDetailsResponse = (response: unknown): Application | null => {
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
    createdAt: asStringOrNull(response.createdAt),
    comment: asStringOrNull(response.comment),
    wordFile,
  }
}

const resolveWordFileHref = (wordFile: string | null) => {
  if (!wordFile) return null
  const trimmed = wordFile.trim()
  if (trimmed.length === 0) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  if (trimmed.startsWith('/')) {
    // Часто сервер возвращает абсолютный путь вида "/uploads/..."
    return `${API_BASE_URL}${trimmed}`
  }

  return `${UPLOADS_BASE_URL}/${trimmed.replace(/^\/+/, '')}`
}

