import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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

import { addMaterialSchema, type AddMaterialFormValues } from '../lib/addMaterialSchema'

export interface AddMaterialDialogProps {
  applicationId: string
  onCreated?: () => void
}

export const AddMaterialDialog = ({ applicationId, onCreated }: AddMaterialDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const defaultValues = useMemo<AddMaterialFormValues>(
    () => ({
      name: '',
      orderedQuantity: 1,
      deliveredQuantity: 0,
    }),
    [],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddMaterialFormValues>({
    resolver: zodResolver(addMaterialSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!isOpen) return
    reset(defaultValues)
  }, [defaultValues, isOpen, reset])

  const handleClose = () => {
    if (isSubmitting) return
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => setIsOpen(next)}>
      <DialogTrigger
        render={
          <Button type="button" aria-label="Добавить материал">
            Добавить материал
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Добавить материал</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          aria-label="Форма добавления материала"
          onSubmit={handleSubmit(async (values) => {
            try {
              await materialsApi.create({
                applicationId,
                name: values.name,
                orderedQuantity: values.orderedQuantity,
                deliveredQuantity: values.deliveredQuantity,
              })
              toastSuccess('Материал добавлен')
              setIsOpen(false)
              onCreated?.()
            } catch (e) {
              toastApiError(e, { title: 'Не удалось добавить материал' })
            }
          })}
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="materialName">
              Наименование
            </label>
            <Input
              id="materialName"
              placeholder="Например: Кабель ВВГнг 3x2.5"
              aria-label="Наименование материала"
              disabled={isSubmitting}
              {...register('name')}
            />
            {errors.name?.message ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="materialOrderedQuantity">
                Заказано
              </label>
              <Input
                id="materialOrderedQuantity"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                aria-label="Количество заказано"
                disabled={isSubmitting}
              {...register('orderedQuantity', { valueAsNumber: true })}
              />
              {errors.orderedQuantity?.message ? (
                <p className="text-sm text-destructive">{String(errors.orderedQuantity.message)}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="materialDeliveredQuantity">
                Поставлено
              </label>
              <Input
                id="materialDeliveredQuantity"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                aria-label="Количество поставлено"
                disabled={isSubmitting}
              {...register('deliveredQuantity', { valueAsNumber: true })}
              />
              {errors.deliveredQuantity?.message ? (
                <p className="text-sm text-destructive">{String(errors.deliveredQuantity.message)}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Можно оставить 0 — статус поставки посчитает сервер.</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="submit" disabled={isSubmitting} aria-label="Сохранить материал">
              {isSubmitting ? 'Сохраняю…' : 'Сохранить'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
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

