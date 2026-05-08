import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { DeliveryStatus, Material } from '@/entities/material'
import {
  deliveryStatusLabelRu,
  deliveryStatusRowClassName,
  deliveryStatusSelectOptions,
} from '@/entities/material'
import { useMaterialsSearch } from '@/shared/api'
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
import { FilterIcon } from 'lucide-react'

type MaterialsListItem = Material & {
  applicationNumber?: string | null
}

type DeliveryStatusFilter = DeliveryStatus | 'NOT_DELIVERED_OR_PARTIALLY' | ''

export const MaterialsPage = () => {
  const navigate = useNavigate()

  const [nameQuery, setNameQuery] = useState('')
  const [applicationNumberQuery, setApplicationNumberQuery] = useState('')
  const [deliveryStatusFilter, setDeliveryStatusFilter] =
    useState<DeliveryStatusFilter>('NOT_DELIVERED_OR_PARTIALLY')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const debouncedNameQuery = useDebouncedValue(nameQuery, 350)
  const debouncedApplicationNumberQuery = useDebouncedValue(applicationNumberQuery, 350)

  const { data: materials = [], error, isLoading } = useMaterialsSearch({
    name: debouncedNameQuery.trim().length > 0 ? debouncedNameQuery.trim() : undefined,
    applicationNumber:
      debouncedApplicationNumberQuery.trim().length > 0
        ? debouncedApplicationNumberQuery.trim()
        : undefined,
  })

  const columns = useMemo<ColumnDef<MaterialsListItem>[]>(
    () => [
      {
        header: 'Наименование',
        accessorKey: 'name',
        cell: ({ row }) => (row.original.name.trim().length > 0 ? row.original.name : '—'),
      },
      {
        id: 'application',
        header: 'Заявка',
        cell: ({ row }) => {
          const applicationId = row.original.applicationId
          const number = row.original.applicationNumber

          if (!applicationId) return '—'

          const label =
            typeof number === 'string' && number.trim().length > 0 ? number.trim() : applicationId

          return (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => navigate(`/applications/${applicationId}`)}
              aria-label="Открыть заявку"
            >
              {label}
            </Button>
          )
        },
      },
      {
        id: 'quantity',
        header: 'Количество',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.orderedQuantity} / {row.original.deliveredQuantity}
          </span>
        ),
      },
      {
        header: 'Статус',
        accessorKey: 'deliveryStatus',
        cell: ({ row }) => deliveryStatusLabelRu[row.original.deliveryStatus],
      },
      {
        header: 'Дата поставки',
        accessorKey: 'deliveredAt',
        cell: ({ row }) => formatDateTimeRu(row.original.deliveredAt ?? null),
      },
    ],
    [navigate],
  )

  const filteredMaterials = useMemo(() => {
    if (!deliveryStatusFilter) return materials

    if (deliveryStatusFilter === 'NOT_DELIVERED_OR_PARTIALLY') {
      return materials.filter(
        (m) => m.deliveryStatus === 'NOT_DELIVERED' || m.deliveryStatus === 'PARTIALLY',
      )
    }

    return materials.filter((m) => m.deliveryStatus === deliveryStatusFilter)
  }, [deliveryStatusFilter, materials])

  const table = useReactTable({
    data: filteredMaterials,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const selectedDeliveryStatusLabel = useMemo(() => {
    if (!deliveryStatusFilter) return undefined
    if (deliveryStatusFilter === 'NOT_DELIVERED_OR_PARTIALLY') return 'Не дошли'
    return deliveryStatusLabelRu[deliveryStatusFilter]
  }, [deliveryStatusFilter])

  const handleResetFilters = () => {
    setNameQuery('')
    setApplicationNumberQuery('')
    setDeliveryStatusFilter('NOT_DELIVERED_OR_PARTIALLY')
  }

  const nameField = (
    <div className="w-full sm:max-w-sm">
      <label className="mb-1 block text-sm font-medium" htmlFor="material-name">
        Наименование
      </label>
      <Input
        id="material-name"
        value={nameQuery}
        onChange={(e) => setNameQuery(e.target.value)}
        placeholder="Например: кабель"
        aria-label="Поиск по наименованию материала"
      />
    </div>
  )

  const applicationNumberField = (
    <div className="w-full sm:max-w-sm">
      <label className="mb-1 block text-sm font-medium" htmlFor="material-application-number">
        Номер заявки
      </label>
      <Input
        id="material-application-number"
        value={applicationNumberQuery}
        onChange={(e) => setApplicationNumberQuery(e.target.value)}
        placeholder="Например: Z-2026-000123"
        aria-label="Поиск по номеру заявки"
      />
    </div>
  )

  const deliveryStatusField = (
    <div className="w-full sm:max-w-sm">
      <span className="mb-1 block text-sm font-medium">Статус поставки</span>
      <Select
        value={deliveryStatusFilter}
        onValueChange={(v) => setDeliveryStatusFilter((v as DeliveryStatusFilter) || '')}
      >
        <SelectTrigger className="w-full" aria-label="Фильтр по статусу поставки">
          <SelectValue placeholder="Все статусы">{selectedDeliveryStatusLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Все статусы</SelectItem>
          <SelectItem value="NOT_DELIVERED_OR_PARTIALLY">Не дошли</SelectItem>
          {deliveryStatusSelectOptions.map((option) => (
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Материалы</h1>
        <p className="text-sm text-muted-foreground">Глобальный поиск/список материалов.</p>
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
                {nameField}
                {applicationNumberField}
                {deliveryStatusField}
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

        <div className="hidden gap-3 sm:flex sm:items-end">
          <div className="flex flex-1 flex-wrap gap-3">
            {nameField}
            {applicationNumberField}
            {deliveryStatusField}
          </div>
          <div className="flex w-full justify-end sm:ml-auto sm:w-auto">
            <Button type="button" variant="ghost" onClick={handleResetFilters} aria-label="Сбросить фильтры">
              Сбросить
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} rows={8} />
      ) : error ? (
        <EmptyState
          title="Не удалось загрузить материалы"
          description="Попробуйте обновить страницу или изменить фильтры."
        />
      ) : filteredMaterials.length === 0 ? (
        <EmptyState title="Ничего не найдено" description="Попробуйте изменить фильтры поиска." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
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
              {table.getRowModel().rows.map((row) => (
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
    </section>
  )
}

