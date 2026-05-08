import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { applicationStatusLabelRu } from '@/entities/application'
import type { Invoice } from '@/entities/invoice'
import { invoiceStatusLabelRu, invoiceStatusRowClassName } from '@/entities/invoice'
import { AddInvoiceDialog, EditInvoiceDialog } from '@/features/invoice-management'
import type { Material } from '@/entities/material'
import { deliveryStatusLabelRu, deliveryStatusRowClassName } from '@/entities/material'
import { AddMaterialDialog, EditDeliveredQuantityDialog } from '@/features/material-management'
import {
  invalidateApplicationAggregate,
  useApplication,
  useInvoices,
  useMaterialsByApplication,
} from '@/shared/api'
import { applicationsApi, invoicesApi } from '@/shared/api'
import { formatCurrencyRub, formatDateTimeRu, resolveFileHref, toastApiError, toastSuccess } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { EmptyState } from '@/shared/ui/emptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { TableSkeleton } from '@/shared/ui/tableSkeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { updateableApplicationStatuses } from '@/features/application-editor/lib/applicationEditorTypes'
import { MoreHorizontalIcon } from 'lucide-react'

export const ApplicationDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const tabStorageKey = useMemo(() => (id ? `application-details-tab:${id}` : null), [id])
  const [activeTab, setActiveTab] = useState<'invoices' | 'materials'>(() => {
    return 'invoices'
  })

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const [invoiceActionId, setInvoiceActionId] = useState<string | null>(null)

  const {
    data: application,
    error,
    isLoading,
    refetch: refetchApplication,
  } = useApplication(id ?? null)

  const {
    data: invoices = [],
    error: invoicesError,
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices,
  } = useInvoices(id ?? null)

  const {
    data: materials = [],
    error: materialsError,
    isLoading: isMaterialsLoading,
    refetch: refetchMaterials,
  } = useMaterialsByApplication(id ?? null)

  useEffect(() => {
    if (!tabStorageKey) return
    try {
      const stored = sessionStorage.getItem(tabStorageKey)
      if (stored === 'invoices' || stored === 'materials') {
        setActiveTab(stored)
      }
    } catch {
      // ignore
    }
  }, [tabStorageKey])

  useEffect(() => {
    if (!tabStorageKey) return
    try {
      sessionStorage.setItem(tabStorageKey, activeTab)
    } catch {
      // ignore
    }
  }, [activeTab, tabStorageKey])

  const wordFileHref = useMemo(() => resolveFileHref(application?.wordFile ?? null), [application?.wordFile])

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
          const href = resolveFileHref(row.original.pdfFile ?? null)
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
              invalidateApplicationAggregate(id)
              await Promise.allSettled([
                refetchInvoices({ force: true }),
                refetchApplication({ force: true }),
              ])
            } catch (e) {
              toastApiError(e, { title: 'Не удалось выбрать счет для оплаты' })
            } finally {
              setInvoiceActionId(null)
            }
          }

          const handleMarkPaid = async () => {
            if (isBusy) return
            const confirmed = window.confirm('Отметить счет как оплаченный? Это действие нельзя отменить.')
            if (!confirmed) return
            setInvoiceActionId(row.original.id)
            try {
              await invoicesApi.markPaid(row.original.id)
              toastSuccess('Счет отмечен как оплаченный')
              invalidateApplicationAggregate(id)
              await Promise.allSettled([
                refetchInvoices({ force: true }),
                refetchApplication({ force: true }),
              ])
            } catch (e) {
              toastApiError(e, { title: 'Не удалось отметить счет как оплаченный' })
            } finally {
              setInvoiceActionId(null)
            }
          }

          return (
            <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
              <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                <EditInvoiceDialog
                  invoice={row.original}
                  disabled={isBusy}
                  onUpdated={() => {
                    invalidateApplicationAggregate(id)
                    void refetchInvoices({ force: true })
                    void refetchApplication({ force: true })
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

              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Действия по счету"
                        disabled={isBusy}
                      />
                    }
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-1 py-1">
                      <EditInvoiceDialog
                        invoice={row.original}
                        disabled={isBusy}
                        onUpdated={() => {
                          invalidateApplicationAggregate(id)
                          void refetchInvoices({ force: true })
                          void refetchApplication({ force: true })
                        }}
                      />
                    </div>
                    {status === 'NEW' ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          void handleSelectForPayment()
                        }}
                      >
                        Выбрать для оплаты
                      </DropdownMenuItem>
                    ) : status === 'SELECTED_FOR_PAYMENT' ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          void handleMarkPaid()
                        }}
                      >
                        Отметить как оплаченный
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        },
      },
    ],
    [id, invoiceActionId, refetchApplication, refetchInvoices],
  )

  const invoicesTable = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const materialsColumns = useMemo<ColumnDef<Material>[]>(
    () => [
      {
        header: 'Наименование',
        accessorKey: 'name',
        cell: ({ row }) => (row.original.name.trim().length > 0 ? row.original.name : '—'),
      },
      {
        header: 'Заказано',
        accessorKey: 'orderedQuantity',
        cell: ({ row }) => row.original.orderedQuantity,
      },
      {
        header: 'Поставлено',
        accessorKey: 'deliveredQuantity',
        cell: ({ row }) => row.original.deliveredQuantity,
      },
      {
        header: 'Статус поставки',
        accessorKey: 'deliveryStatus',
        cell: ({ row }) => deliveryStatusLabelRu[row.original.deliveryStatus],
      },
      {
        header: 'Дата поставки',
        accessorKey: 'deliveredAt',
        cell: ({ row }) => formatDateTimeRu(row.original.deliveredAt ?? null),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <EditDeliveredQuantityDialog
              material={row.original}
              onUpdated={() => {
                invalidateApplicationAggregate(id)
                void refetchMaterials({ force: true })
                void refetchApplication({ force: true })
              }}
            />
          </div>
        ),
      },
    ],
    [id, refetchApplication, refetchMaterials],
  )

  const materialsTable = useReactTable({
    data: materials,
    columns: materialsColumns,
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
            <Button type="button" onClick={() => refetchApplication({ force: true })}>
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
                    invalidateApplicationAggregate(id)
                    await refetchApplication({ force: true })
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
            <p className="text-sm font-medium">Описание заявки</p>
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

      <Tabs value={activeTab} onValueChange={(next) => setActiveTab(next as 'invoices' | 'materials')}>
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
                  invalidateApplicationAggregate(id)
                  void refetchInvoices({ force: true })
                  void refetchApplication({ force: true })
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
                  <Button type="button" onClick={() => refetchInvoices({ force: true })}>
                    Перезагрузить
                  </Button>
                }
              />
            ) : invoices.length === 0 ? (
              <EmptyState
                title="Счетов пока нет"
                description="Добавь первый счет, чтобы начать оплату."
                action={
                  <Button type="button" variant="secondary" onClick={() => refetchInvoices({ force: true })}>
                    Обновить
                  </Button>
                }
              />
            ) : (
              <div>
                <Table>
                  <TableHeader className="bg-card [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card">
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
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Материалы</p>
                <p className="text-sm text-muted-foreground">
                  Сервер рассчитывает статус поставки и может менять статус заявки — после действий мы рефетчим.
                </p>
              </div>
              <AddMaterialDialog
                applicationId={id}
                onCreated={() => {
                  invalidateApplicationAggregate(id)
                  void refetchMaterials({ force: true })
                  void refetchApplication({ force: true })
                }}
              />
            </div>

            {isMaterialsLoading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : materialsError ? (
              <EmptyState
                title="Не удалось загрузить материалы"
                description="Проверь API и попробуй ещё раз."
                action={
                  <Button type="button" onClick={() => refetchMaterials({ force: true })}>
                    Перезагрузить
                  </Button>
                }
              />
            ) : materials.length === 0 ? (
              <EmptyState
                title="Материалов пока нет"
                description="Добавь первый материал, чтобы начать отслеживать поставку."
                action={
                  <Button type="button" variant="secondary" onClick={() => refetchMaterials({ force: true })}>
                    Обновить
                  </Button>
                }
              />
            ) : (
              <div>
                <Table>
                  <TableHeader className="bg-card [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card">
                    {materialsTable.getHeaderGroups().map((headerGroup) => (
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
                    {materialsTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={deliveryStatusRowClassName[row.original.deliveryStatus]}
                      >
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
      </Tabs>
    </section>
  )
}

