import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ApplicationEditorForm,
  applicationEditorApi,
  normalizeApplicationEditorEntity,
} from '@/features/application-editor'
import { UPLOADS_BASE_URL } from '@/config'
import { toastApiError, toastSuccess } from '@/shared/lib'
import { TableSkeleton } from '@/shared/ui/tableSkeleton'

import type { ApplicationEditorEntity, ApplicationEditorFormValues } from '@/features/application-editor'

export const ApplicationEditPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [entity, setEntity] = useState<ApplicationEditorEntity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = useMemo(() => 'Редактировать заявку', [])

  useEffect(() => {
    if (!id) return

    let isCancelled = false

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await applicationEditorApi.getById(id)
        const normalized = normalizeApplicationEditorEntity(response)
        if (!normalized) throw new Error('Unexpected get application response shape')
        if (isCancelled) return
        setEntity(normalized)
      } catch (e) {
        if (!isCancelled) toastApiError(e, { title: 'Не удалось загрузить заявку' })
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [id])

  const wordFileHref = useMemo(() => {
    if (!entity?.wordFile) return null
    const value = entity.wordFile.trim()
    if (value.length === 0) return null
    if (/^https?:\/\//i.test(value)) return value
    return `${UPLOADS_BASE_URL}/${value.replace(/^\/+/, '')}`
  }, [entity])

  const handleSubmit = async (values: ApplicationEditorFormValues) => {
    if (!id) return
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await applicationEditorApi.update(id, {
        applicationNumber: values.applicationNumber?.trim() ? values.applicationNumber.trim() : undefined,
        comment: values.comment?.trim() ? values.comment.trim() : undefined,
        status: values.status,
      })

      if (values.wordFile) {
        await applicationEditorApi.uploadWordFile(id, values.wordFile)
      }

      toastSuccess('Заявка обновлена')
      navigate(`/applications/${id}`)
    } catch (e) {
      toastApiError(e, { title: 'Не удалось обновить заявку' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!id) {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Редактирование заявки</h1>
        <p className="text-sm text-muted-foreground">Некорректный URL: отсутствует id.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">ID: {id}</p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={1} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Word файл</p>
                {wordFileHref ? (
                  <a
                    className="text-sm text-primary underline underline-offset-4 hover:no-underline"
                    href={wordFileHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Скачать / открыть
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </div>

          <ApplicationEditorForm
            mode="edit"
            entity={entity}
            isSubmitting={isSubmitting}
            onCancel={() => navigate(`/applications/${id}`)}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </section>
  )
}

