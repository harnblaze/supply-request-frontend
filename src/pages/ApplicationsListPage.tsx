import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  type Application,
  type ApplicationStatus,
  applicationStatusLabelRu,
  applicationStatusRowClassName,
  applicationStatusSelectOptions,
} from '@/entities/application'
import { applicationsApi } from '@/shared/api'
import { formatDateTimeRu, toastApiError, toastInfo, useDebouncedValue } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/emptyState'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { TableSkeleton } from '@/shared/ui/tableSkeleton'

export const ApplicationsListPage = () => {
  const navigate = useNavigate()

  const [applicationNumberQuery, setApplicationNumberQuery] = useState('')
  const [status, setStatus] = useState<ApplicationStatus | ''>('')

  const debouncedApplicationNumberQuery = useDebouncedValue(applicationNumberQuery, 350)
  const debouncedStatus = useDebouncedValue(status, 350)

  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const selectedStatusLabel = status ? applicationStatusLabelRu[status] : undefined

  const handleCreateClick = () => {
    toastInfo('Пока не реализовано', {
      description: 'Создание заявки будет в следующих пунктах roadmap.',
    })
  }

  const handleRowOpen = useCallback(
    (id: string) => {
      navigate(`/applications/${id}`)
    },
    [navigate],
  )

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await applicationsApi.list<unknown>({
          applicationNumber:
            debouncedApplicationNumberQuery.trim().length > 0
              ? debouncedApplicationNumberQuery.trim()
              : undefined,
          status: debouncedStatus || undefined,
        })

        const list = normalizeApplicationsListResponse(response)
        const sorted = [...list].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return bTime - aTime
        })

        if (isCancelled) return
        setApplications(sorted)
      } catch (e) {
        if (isCancelled) return
        setError(e)
        toastApiError(e, { title: 'Не удалось загрузить заявки' })
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [debouncedApplicationNumberQuery, debouncedStatus, reloadToken])

  const columns = useMemo<ColumnDef<Application>[]>(
    () => [
      {
        header: 'Номер заявки',
        accessorKey: 'applicationNumber',
        cell: ({ row }) => {
          const value = row.original.applicationNumber
          return value && String(value).trim().length > 0 ? String(value) : '—'
        },
      },
      {
        header: 'Дата создания',
        accessorKey: 'createdAt',
        cell: ({ row }) => formatDateTimeRu(row.original.createdAt ?? null),
      },
      {
        header: 'Статус',
        accessorKey: 'status',
        cell: ({ row }) => applicationStatusLabelRu[row.original.status],
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleRowOpen(row.original.id)}
            >
              Открыть
            </Button>
          </div>
        ),
      },
    ],
    [handleRowOpen],
  )

  const table = useReactTable({
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Заявки</h1>
          <p className="text-sm text-muted-foreground">Список заявок на закупку.</p>
        </div>
        <Button type="button" onClick={handleCreateClick}>
          Создать заявку
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-sm">
          <label className="mb-1 block text-sm font-medium" htmlFor="application-number">
            Номер заявки
          </label>
          <Input
            id="application-number"
            value={applicationNumberQuery}
            onChange={(e) => setApplicationNumberQuery(e.target.value)}
            placeholder="Например: Z-2026-000123"
            aria-label="Поиск по номеру заявки"
          />
        </div>

        <div className="w-full sm:max-w-sm">
          <span className="mb-1 block text-sm font-medium">Статус</span>
          <Select value={status} onValueChange={(v) => setStatus((v as ApplicationStatus) || '')}>
            <SelectTrigger className="w-full" aria-label="Фильтр по статусу">
              <SelectValue placeholder="Все статусы">{selectedStatusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все статусы</SelectItem>
              {applicationStatusSelectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full justify-end sm:ml-auto sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setApplicationNumberQuery('')
              setStatus('')
            }}
            aria-label="Сбросить фильтры"
          >
            Сбросить
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : error ? (
        <EmptyState
          title="Не удалось загрузить список"
          description="Проверь API и попробуй ещё раз."
          action={
            <Button type="button" onClick={() => setReloadToken((v) => v + 1)}>
              Перезагрузить
            </Button>
          }
        />
      ) : applications.length === 0 ? (
        <EmptyState
          title="Заявок не найдено"
          description="Попробуй изменить фильтры или создать новую заявку."
          action={
            <Button type="button" onClick={handleCreateClick}>
              Создать заявку
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table aria-label="Список заявок">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
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
              {table.getRowModel().rows.map((row) => {
                const rowClassName = applicationStatusRowClassName[row.original.status]

                return (
                  <TableRow
                    key={row.id}
                    className={rowClassName}
                    role="button"
                    tabIndex={0}
                    aria-label={`Открыть заявку ${row.original.applicationNumber ?? row.original.id}`}
                    onClick={() => handleRowOpen(row.original.id)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return
                      e.preventDefault()
                      handleRowOpen(row.original.id)
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
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

const normalizeApplication = (value: unknown): Application | null => {
  if (!isRecord(value)) return null

  const id = value.id
  const status = value.status
  if (typeof id !== 'string') return null
  if (typeof status !== 'string') return null

  return {
    id,
    status: status as ApplicationStatus,
    applicationNumber: asStringOrNull(value.applicationNumber),
    createdAt: asStringOrNull(value.createdAt),
  }
}

const normalizeApplicationsListResponse = (response: unknown): Application[] => {
  const rawItems = Array.isArray(response)
    ? response
    : isRecord(response) && Array.isArray(response.items)
      ? response.items
      : isRecord(response) && Array.isArray(response.data)
        ? response.data
        : []

  return rawItems.map(normalizeApplication).filter((item): item is Application => Boolean(item))
}

