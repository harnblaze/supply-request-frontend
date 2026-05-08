import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import type { ApplicationStatus } from '@/entities/application'
import { applicationStatusLabelRu } from '@/entities/application'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import type { ApplicationEditorEntity, ApplicationEditorMode } from '../lib/applicationEditorTypes'
import { updateableApplicationStatuses } from '../lib/applicationEditorTypes'
import { applicationEditorSchema, type ApplicationEditorFormValues } from '../lib/applicationEditorSchema'

export interface ApplicationEditorFormProps {
  mode: ApplicationEditorMode
  entity?: ApplicationEditorEntity | null
  isSubmitting?: boolean
  onCancel?: () => void
  onSubmit: (values: ApplicationEditorFormValues) => Promise<void> | void
}

const statusOptions = updateableApplicationStatuses.map((status) => ({
  value: status,
  label: applicationStatusLabelRu[status satisfies ApplicationStatus],
}))

export const ApplicationEditorForm = ({
  mode,
  entity,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: ApplicationEditorFormProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const defaultValues = useMemo<ApplicationEditorFormValues>(() => {
    if (mode === 'create') {
      return {
        applicationNumber: '',
        comment: '',
        status: 'DRAFT',
        wordFile: null,
      }
    }

    return {
      applicationNumber: entity?.applicationNumber ?? '',
      comment: entity?.comment ?? '',
      status: updateableApplicationStatuses.includes((entity?.status ?? 'DRAFT') as never)
        ? ((entity?.status ?? 'DRAFT') as 'DRAFT' | 'SENT_TO_SUPPLY')
        : undefined,
      wordFile: null,
    }
  }, [entity?.applicationNumber, entity?.comment, entity?.status, mode])

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ApplicationEditorFormValues>({
    resolver: zodResolver(applicationEditorSchema),
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const resolvedTitle = mode === 'create' ? 'Создание заявки' : 'Редактирование заявки'

  const isStatusEditable =
    mode === 'edit' &&
    Boolean(entity) &&
    updateableApplicationStatuses.includes((entity?.status ?? 'DRAFT') as never)

  return (
    <form
      className="space-y-6"
      aria-label={resolvedTitle}
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values)
      })}
    >
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="applicationNumber">
            Номер заявки
          </label>
          <Input
            id="applicationNumber"
            placeholder="Например: Z-2026-000123"
            aria-label="Номер заявки"
            {...register('applicationNumber')}
          />
          {errors.applicationNumber?.message ? (
            <p className="text-sm text-destructive">{errors.applicationNumber.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="comment">
            Описание заявки
          </label>
          <Textarea
            id="comment"
            placeholder="Например: срочная закупка, срок до пятницы…"
            aria-label="Описание заявки"
            rows={5}
            {...register('comment')}
          />
          {errors.comment?.message ? (
            <p className="text-sm text-destructive">{errors.comment.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium">Статус</span>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange((v as 'DRAFT' | 'SENT_TO_SUPPLY') || undefined)}
                disabled={mode === 'create' || !isStatusEditable || isSubmitting}
              >
                <SelectTrigger className="w-full" aria-label="Статус заявки">
                  <SelectValue placeholder={mode === 'create' ? 'DRAFT' : '—'}>
                    {field.value ? applicationStatusLabelRu[field.value] : '—'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {mode === 'create' ? (
            <p className="text-sm text-muted-foreground">
              При создании статус выставляется сервером. Здесь он отображается как DRAFT.
            </p>
          ) : !isStatusEditable ? (
            <p className="text-sm text-muted-foreground">
              Этот статус нельзя менять вручную (дальше он управляется серверной логикой).
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="wordFile">
            Word файл (.doc/.docx)
          </label>
          <Input
            id="wordFile"
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx"
            aria-label="Загрузить Word файл"
            disabled={isSubmitting}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setValue('wordFile', file, { shouldValidate: true })
            }}
          />
          {errors.wordFile?.message ? (
            <p className="text-sm text-destructive">{String(errors.wordFile.message)}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting} aria-label="Сохранить заявку">
          {isSubmitting ? 'Сохраняю…' : 'Сохранить'}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Отмена"
          >
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  )
}

