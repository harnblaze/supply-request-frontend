import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { invalidateApplicationAggregate, invoicesApi } from '@/shared/api'
import { toastApiError, toastSuccess } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

import { addInvoiceSchema, type AddInvoiceFormValues } from '../lib/addInvoiceSchema'

export interface AddInvoiceDialogProps {
  applicationId: string
  onCreated?: () => void
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const pickFirstString = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) return value
  }
  return null
}

export const AddInvoiceDialog = ({ applicationId, onCreated }: AddInvoiceDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const defaultValues = useMemo<AddInvoiceFormValues>(
    () => ({
      supplier: '',
      amount: '',
      pdfFile: null,
    }),
    [],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<AddInvoiceFormValues>({
    resolver: zodResolver(addInvoiceSchema),
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
          <Button type="button" aria-label="Добавить счет">
            Добавить счет
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Добавить счет</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          aria-label="Форма добавления счета"
          onSubmit={handleSubmit(async (values) => {
            try {
              const created = await invoicesApi.create<unknown>({
                applicationId,
                supplier: values.supplier,
                amount: values.amount,
              })

              const createdId =
                isRecord(created) ? pickFirstString(created, ['id', 'invoiceId']) : null

              if (values.pdfFile && createdId) {
                await invoicesApi.uploadPdfFile(createdId, values.pdfFile)
              }

              toastSuccess('Счет добавлен')
              invalidateApplicationAggregate(applicationId)
              setIsOpen(false)
              onCreated?.()
            } catch (e) {
              toastApiError(e, { title: 'Не удалось добавить счет' })
            }
          })}
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="invoiceSupplier">
              Поставщик
            </label>
            <Input
              id="invoiceSupplier"
              placeholder="Например: ООО Ромашка"
              aria-label="Поставщик"
              disabled={isSubmitting}
              {...register('supplier')}
            />
            {errors.supplier?.message ? (
              <p className="text-sm text-destructive">{errors.supplier.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="invoiceAmount">
              Сумма
            </label>
            <Input
              id="invoiceAmount"
              inputMode="decimal"
              placeholder="Например: 12345.67"
              aria-label="Сумма счета"
              disabled={isSubmitting}
              {...register('amount')}
            />
            {errors.amount?.message ? (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Поддерживается точка или запятая, максимум 2 знака после точки.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="invoicePdf">
              PDF (опционально)
            </label>
            <Input
              id="invoicePdf"
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              aria-label="Загрузить PDF счета"
              disabled={isSubmitting}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setValue('pdfFile', file, { shouldValidate: true })
              }}
            />
            {errors.pdfFile?.message ? (
              <p className="text-sm text-destructive">{String(errors.pdfFile.message)}</p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="submit" disabled={isSubmitting} aria-label="Сохранить счет">
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

