import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApplicationEditorForm, applicationEditorApi, normalizeApplicationEditorEntity } from '@/features/application-editor'
import { toastApiError, toastSuccess } from '@/shared/lib'

import type { ApplicationEditorFormValues } from '@/features/application-editor'

export const ApplicationCreatePage = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = useMemo(() => 'Создать заявку', [])

  const handleSubmit = async (values: ApplicationEditorFormValues) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const createResponse = await applicationEditorApi.create({
        applicationNumber: values.applicationNumber?.trim() ? values.applicationNumber.trim() : undefined,
        comment: values.comment?.trim() ? values.comment.trim() : undefined,
      })

      const created = normalizeApplicationEditorEntity(createResponse)
      if (!created) throw new Error('Unexpected create application response shape')

      if (values.wordFile) {
        await applicationEditorApi.uploadWordFile(created.id, values.wordFile)
      }

      toastSuccess('Заявка создана')
      navigate(`/applications/${created.id}`)
    } catch (e) {
      toastApiError(e, { title: 'Не удалось создать заявку' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Заполни поля и нажми “Сохранить”.</p>
      </div>

      <ApplicationEditorForm
        mode="create"
        isSubmitting={isSubmitting}
        onCancel={() => navigate('/')}
        onSubmit={handleSubmit}
      />
    </section>
  )
}

