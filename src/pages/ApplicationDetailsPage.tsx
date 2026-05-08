import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { Application, ApplicationStatus } from '@/entities/application'
import { applicationStatusLabelRu } from '@/entities/application'
import type { Invoice, InvoiceStatus } from '@/entities/invoice'
import { invoiceStatusLabelRu, invoiceStatusRowClassName } from '@/entities/invoice'
import { AddInvoiceDialog, EditInvoiceDialog } from '@/features/invoice-management'
import { applicationsApi } from '@/shared/api'
import { invoicesApi } from '@/shared/api'
import { API_BASE_URL, UPLOADS_BASE_URL } from '@/config'
import { formatCurrencyRub, formatDateTimeRu, toastApiError, toastSuccess } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/emptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { TableSkeleton } from '@/shared/ui/tableSkeleton'
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

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false)
  const [invoicesError, setInvoicesError] = useState<unknown>(null)
  const [invoicesReloadToken, setInvoicesReloadToken] = useState(0)
  const [invoiceActionId, setInvoiceActionId] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setReloadToken((v) => v + 1)
  }, [])

  const refetchInvoices = useCallback(() => {
    setInvoicesReloadToken((v) => v + 1)
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

  useEffect(() => {
    if (!id) return
    let isCancelled = false

    const loadInvoices = async () => {
      setIsInvoicesLoading(true)
      setInvoicesError(null)

      try {
        const response = await applicationsApi.listInvoices<unknown>(id)
        const normalized = normalizeInvoicesListResponse(response)
        if (isCancelled) return
        setInvoices(normalized)
      } catch (e) {
        if (isCancelled) return
        setInvoicesError(e)
        toastApiError(e, { title: 'Не удалось загрузить счета' })
      } finally {
        if (!isCancelled) setIsInvoicesLoading(false)
      }
    }

    void loadInvoices()

    return () => {
      isCancelled = true
    }
  }, [id, invoicesReloadToken])

  const wordFileHref = useMemo(() => resolveWordFileHref(application?.wordFile ?? null), [
    application?.wordFile,
  ])

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        header: 'Поставщик',
        accessorKey: 'supplier',
        cell: ({ row }) => (row.original.supplier.trim().length > 0 ? row.original.supplier : '—'),
      },
      {
        header: 'Сумма',
        accessorKey: 'amount',
        cell: ({ row }) => formatCurrencyRub(row.original.amount),
      },
      {
        header: 'Статус',
        accessorKey: 'status',
        cell: ({ row }) => invoiceStatusLabelRu[row.original.status],
      },
      {
        header: 'Дата оплаты',
        accessorKey: 'paidAt',
        cell: ({ row }) => formatDateTimeRu(row.original.paidAt ?? null),
      },
      {
        id: 'pdf',
        header: 'PDF',
        cell: ({ row }) => {
          const href = resolveInvoicePdfHref(row.original.pdfFile ?? null)
          if (!href) return '—'
          return (
            <a
              className="text-sm font-medium text-primary underline underline-offset-4 hover:opacity-90"
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label="Открыть PDF счета"
            >
              Открыть
            </a>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const status = row.original.status
          const isBusy = invoiceActionId === row.original.id

          const handleSelectForPayment = async () => {
            if (isBusy) return
            setInvoiceActionId(row.original.id)
            try {
              await invoicesApi.selectForPayment(row.original.id)
              toastSuccess('Счет выбран для оплаты')
              refetchInvoices()
              refetch()
            } catch (e) {
              toastApiError(e, { title: 'Не удалось выбрать счет для оплаты' })
            } finally {
              setInvoiceActionId(null)
            }
          }

          const handleMarkPaid = async () => {
            if (isBusy) return
            setInvoiceActionId(row.original.id)
            try {
              await invoicesApi.markPaid(row.original.id)
              toastSuccess('Счет отмечен как оплаченный')
              refetchInvoices()
              refetch()
            } catch (e) {
              toastApiError(e, { title: 'Не удалось отметить счет как оплаченный' })
            } finally {
              setInvoiceActionId(null)
            }
          }

          return (
            <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
              <EditInvoiceDialog
                invoice={row.original}
                disabled={isBusy}
                onUpdated={() => {
                  refetchInvoices()
                  refetch()
                }}
              />
              {status === 'NEW' ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectForPayment}
                  disabled={isBusy}
                  aria-label="Выбрать счет для оплаты"
                >
                  {isBusy ? '...' : 'Выбрать для оплаты'}
                </Button>
              ) : status === 'SELECTED_FOR_PAYMENT' ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleMarkPaid}
                  disabled={isBusy}
                  aria-label="Отметить счет как оплаченный"
                >
                  {isBusy ? '...' : 'Отметить как оплаченный'}
                </Button>
              ) : null}
            </div>
          )
        },
      },
    ],
    [invoiceActionId, refetch, refetchInvoices],
  )

  const invoicesTable = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

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
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Счета</p>
                <p className="text-sm text-muted-foreground">
                  После действий статус заявки обновится (серверная логика) — мы рефетчим заявку и список счетов.
                </p>
              </div>
              <AddInvoiceDialog
                applicationId={id}
                onCreated={() => {
                  refetchInvoices()
                  refetch()
                }}
              />
            </div>

            {isInvoicesLoading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : invoicesError ? (
              <EmptyState
                title="Не удалось загрузить счета"
                description="Проверь API и попробуй ещё раз."
                action={
                  <Button type="button" onClick={refetchInvoices}>
                    Перезагрузить
                  </Button>
                }
              />
            ) : invoices.length === 0 ? (
              <EmptyState
                title="Счетов пока нет"
                description="Добавь первый счет, чтобы начать оплату."
                action={
                  <Button type="button" variant="secondary" onClick={refetchInvoices}>
                    Обновить
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {invoicesTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {invoicesTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className={invoiceStatusRowClassName[row.original.status]}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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

const normalizeInvoicesListResponse = (response: unknown): Invoice[] => {
  if (Array.isArray(response)) {
    return response.map(normalizeInvoice).filter((v): v is Invoice => Boolean(v))
  }

  if (isRecord(response)) {
    const maybeItems = response.items
    if (Array.isArray(maybeItems)) {
      return maybeItems.map(normalizeInvoice).filter((v): v is Invoice => Boolean(v))
    }
  }

  return []
}

const normalizeInvoice = (value: unknown): Invoice | null => {
  if (!isRecord(value)) return null

  const id = value.id
  const status = value.status

  if (typeof id !== 'string') return null
  if (typeof status !== 'string') return null

  const supplier = typeof value.supplier === 'string' ? value.supplier : ''
  const amount = typeof value.amount === 'string' ? value.amount : String(value.amount ?? '')

  const pdfFile = pickFirstString(value, ['pdfFile', 'pdfFilePath', 'pdfFileUrl', 'pdfFileName'])

  return {
    id,
    status: status as InvoiceStatus,
    supplier,
    amount,
    applicationId: asStringOrNull(value.applicationId),
    paidAt: asStringOrNull(value.paidAt),
    pdfFile,
    createdAt: asStringOrNull(value.createdAt),
  }
}

const resolveInvoicePdfHref = (pdfFile: string | null) => {
  if (!pdfFile) return null
  const trimmed = pdfFile.trim()
  if (trimmed.length === 0) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`
  }

  return `${UPLOADS_BASE_URL}/${trimmed.replace(/^\/+/, '')}`
}

