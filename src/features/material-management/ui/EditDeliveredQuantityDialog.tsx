import { useEffect, useMemo, useState } from 'react'
import { type FieldErrors, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import type { Material } from '@/entities/material'
import { materialsApi } from '@/shared/api'
import { toastApiError, toastSuccess } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

import {
  editDeliveredQuantitySchema,
  type EditDeliveredQuantityFormValues,
} from '../lib/editDeliveredQuantitySchema'

export interface EditDeliveredQuantityDialogProps {
  material: Material
  disabled?: boolean
  onUpdated?: () => void
}

export const EditDeliveredQuantityDialog = ({
  material,
  disabled = false,
  onUpdated,
}: EditDeliveredQuantityDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const defaultValues = useMemo<EditDeliveredQuantityFormValues>(
    () => ({
      deliveredQuantity: material.deliveredQuantity,
    }),
    [material.deliveredQuantity],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    clearErrors,
    reset,
  } = useForm<EditDeliveredQuantityFormValues>({
    resolver: zodResolver(editDeliveredQuantitySchema),
    defaultValues,
  })

  useEffect(() => {
    if (!isOpen) return
    reset(defaultValues)
  }, [defaultValues, isOpen, reset])

  const isUiDisabled = disabled || isSubmitting

  const maxValue = material.orderedQuantity
  const deliveredQuantityValue = watch('deliveredQuantity')

  useEffect(() => {
    if (!isOpen) return
    const numericValue =
      typeof deliveredQuantityValue === 'number'
        ? deliveredQuantityValue
        : typeof deliveredQuantityValue === 'string'
          ? Number(deliveredQuantityValue)
          : Number.NaN

    if (!Number.isFinite(numericValue)) return

    if (numericValue > material.orderedQuantity) {
      setError('deliveredQuantity', {
        type: 'validate',
        message: 'Поставлено не может быть больше, чем заказано',
      })
      return
    }

    if (errors.deliveredQuantity?.type === 'validate') {
      clearErrors('deliveredQuantity')
    }
  }, [
    clearErrors,
    deliveredQuantityValue,
    errors.deliveredQuantity?.type,
    isOpen,
    material.orderedQuantity,
    setError,
  ])

  return (
    <Dialog open={isOpen} onOpenChange={(next) => setIsOpen(next)}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label="Изменить количество поставлено"
          >
            Изменить количество
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Изменить количество поставлено</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          aria-label="Форма изменения количества поставки"
          onSubmit={handleSubmit(async (values) => {
            if (values.deliveredQuantity > material.orderedQuantity) return
            try {
              await materialsApi.update(material.id, { deliveredQuantity: values.deliveredQuantity })
              toastSuccess('Количество поставки обновлено')
              setIsOpen(false)
              onUpdated?.()
            } catch (e) {
              toastApiError(e, { title: 'Не удалось обновить количество' })
            }
          })}
        >
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {material.name} — заказано {material.orderedQuantity}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor={`editDeliveredQuantity-${material.id}`}>
              Поставлено
            </label>
            <Input
              id={`editDeliveredQuantity-${material.id}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={maxValue}
              step={1}
              aria-label="Количество поставлено"
              disabled={isUiDisabled}
              {...register('deliveredQuantity', { valueAsNumber: true })}
            />
            {valuesErrorMessage(errors, material.orderedQuantity)}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="submit" disabled={isUiDisabled} aria-label="Сохранить количество поставки">
              {isSubmitting ? 'Сохраняю…' : 'Сохранить'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (isSubmitting) return
                setIsOpen(false)
              }}
              disabled={isUiDisabled}
              aria-label="Отмена"
            >
              Отмена
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const valuesErrorMessage = (
  errors: FieldErrors<EditDeliveredQuantityFormValues>,
  orderedQuantity: number,
) => {
  const message = errors.deliveredQuantity?.message ? String(errors.deliveredQuantity.message) : null
  if (message) return <p className="text-sm text-destructive">{message}</p>
  return (
    <p className="text-sm text-muted-foreground">
      Значение должно быть от 0 до {orderedQuantity}. Статус поставки пересчитает сервер.
    </p>
  )
}

