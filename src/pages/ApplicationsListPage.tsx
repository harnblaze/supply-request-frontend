import { useCallback, useMemo, useState } from 'react'
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
import { useApplicationsList } from '@/shared/api'
import { formatDateTimeRu, useDebouncedValue } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
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
import { FilterIcon, MoreHorizontalIcon } from 'lucide-react'

export const ApplicationsListPage = () => {
  const navigate = useNavigate()

  const [applicationNumberQuery, setApplicationNumberQuery] = useState('')
  const [status, setStatus] = useState<ApplicationStatus | ''>('')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const debouncedApplicationNumberQuery = useDebouncedValue(applicationNumberQuery, 350)
  const debouncedStatus = useDebouncedValue(status, 350)

  const {
    data: applications = [],
    error,
    isLoading,
    refetch,
  } = useApplicationsList({
    applicationNumber:
      debouncedApplicationNumberQuery.trim().length > 0
        ? debouncedApplicationNumberQuery.trim()
        : undefined,
    status: debouncedStatus || undefined,
  })

  const selectedStatusLabel = status ? applicationStatusLabelRu[status] : undefined

  const handleResetFilters = () => {
    setApplicationNumberQuery('')
    setStatus('')
  }

  const handleCreateClick = () => {
    navigate('/applications/new')
  }

  const handleRowOpen = useCallback(
    (id: string) => {
      navigate(`/applications/${id}`)
    },
    [navigate],
  )

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
        header: 'Описание заявки',
        accessorKey: 'comment',
        cell: ({ row }) => {
          const value = row.original.comment
          const normalized = typeof value === 'string' ? value.trim() : ''
          if (normalized.length === 0) return '—'
          return (
            <span className="block max-w-[520px] truncate text-sm" title={normalized}>
              {normalized}
            </span>
          )
        },
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
            <div className="hidden sm:block">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRowOpen(row.original.id)
                }}
              >
                Открыть
              </Button>
            </div>
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Действия по заявке"
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRowOpen(row.original.id)
                    }}
                  >
                    Открыть
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

  const applicationNumberField = (
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
  )

  const statusField = (
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
  )

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

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <Drawer open={isMobileFiltersOpen} onOpenChange={(next) => setIsMobileFiltersOpen(next)}>
            <DrawerTrigger asChild>
              <Button type="button" variant="secondary" aria-label="Открыть фильтры">
                <FilterIcon className="mr-2" />
                Фильтры
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-2">
              <DrawerHeader>
                <DrawerTitle>Фильтры</DrawerTitle>
              </DrawerHeader>
              <div className="space-y-3">
                {applicationNumberField}
                {statusField}
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button type="button" aria-label="Закрыть фильтры">
                    Применить
                  </Button>
                </DrawerClose>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetFilters}
                  aria-label="Сбросить фильтры"
                >
                  Сбросить
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Button type="button" variant="ghost" onClick={handleResetFilters} aria-label="Сбросить фильтры">
            Сбросить
          </Button>
        </div>

        <div className="hidden gap-3 sm:flex sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-wrap gap-3">
            {applicationNumberField}
            {statusField}
          </div>
          <div className="flex w-full justify-end sm:ml-auto sm:w-auto">
            <Button type="button" variant="ghost" onClick={handleResetFilters} aria-label="Сбросить фильтры">
              Сбросить
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : error ? (
        <EmptyState
          title="Не удалось загрузить список"
          description="Проверь API и попробуй ещё раз."
          action={
            <Button type="button" onClick={() => refetch({ force: true })}>
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
            <TableHeader className="bg-card [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card">
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

