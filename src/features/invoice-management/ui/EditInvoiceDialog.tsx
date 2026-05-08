import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import type { Invoice } from '@/entities/invoice'
import { invoicesApi } from '@/shared/api'
import { toastApiError, toastSuccess } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

import { editInvoiceSchema, type EditInvoiceFormValues } from '../lib/editInvoiceSchema'

export interface EditInvoiceDialogProps {
  invoice: Invoice
  disabled?: boolean
  onUpdated?: () => void
}

export const EditInvoiceDialog = ({
  invoice,
  disabled = false,
  onUpdated,
}: EditInvoiceDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const defaultValues = useMemo<EditInvoiceFormValues>(
    () => ({
      supplier: invoice.supplier ?? '',
      amount: invoice.amount ?? '',
      pdfFile: null,
    }),
    [invoice.amount, invoice.supplier],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<EditInvoiceFormValues>({
    resolver: zodResolver(editInvoiceSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!isOpen) return
    reset(defaultValues)
  }, [defaultValues, isOpen, reset])

  const isUiDisabled = disabled || isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={(next) => setIsOpen(next)}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label="Редактировать счет"
          >
            Редактировать
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Редактировать счет</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          aria-label="Форма редактирования счета"
          onSubmit={handleSubmit(async (values) => {
            try {
              await invoicesApi.update(invoice.id, {
                supplier: values.supplier,
                amount: values.amount,
              })

              if (values.pdfFile) {
                await invoicesApi.uploadPdfFile(invoice.id, values.pdfFile)
              }

              toastSuccess('Счет обновлён')
              setIsOpen(false)
              onUpdated?.()
            } catch (e) {
              toastApiError(e, { title: 'Не удалось обновить счет' })
            }
          })}
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor={`editInvoiceSupplier-${invoice.id}`}>
              Поставщик
            </label>
            <Input
              id={`editInvoiceSupplier-${invoice.id}`}
              placeholder="Например: ООО Ромашка"
              aria-label="Поставщик"
              disabled={isUiDisabled}
              {...register('supplier')}
            />
            {errors.supplier?.message ? (
              <p className="text-sm text-destructive">{errors.supplier.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor={`editInvoiceAmount-${invoice.id}`}>
              Сумма
            </label>
            <Input
              id={`editInvoiceAmount-${invoice.id}`}
              inputMode="decimal"
              placeholder="Например: 12345.67"
              aria-label="Сумма счета"
              disabled={isUiDisabled}
              {...register('amount')}
            />
            {errors.amount?.message ? (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Поддерживается точка или запятая, максимум 2 знака после точки.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor={`editInvoicePdf-${invoice.id}`}>
              PDF (загрузить/заменить)
            </label>
            <Input
              id={`editInvoicePdf-${invoice.id}`}
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              aria-label="Загрузить PDF счета"
              disabled={isUiDisabled}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setValue('pdfFile', file, { shouldValidate: true })
              }}
            />
            {errors.pdfFile?.message ? (
              <p className="text-sm text-destructive">{String(errors.pdfFile.message)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Если не выбрать файл, PDF не изменится.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="submit" disabled={isUiDisabled} aria-label="Сохранить изменения счета">
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

