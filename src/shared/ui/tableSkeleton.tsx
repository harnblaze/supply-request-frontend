import React from 'react'

import { cn } from '@/shared/lib'
import { Skeleton } from '@/shared/ui/skeleton'

export interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

const gridColsClassByNumber: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 6,
  columns = 4,
  className,
}) => {
  const safeRows = Math.max(1, Math.min(50, rows))
  const safeColumns = Math.max(1, Math.min(12, columns))
  const gridColsClassName = gridColsClassByNumber[safeColumns] ?? 'grid-cols-4'

  return (
    <div className={cn('rounded-lg border', className)} aria-busy="true" aria-live="polite">
      <div className="border-b p-3">
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="divide-y">
        {Array.from({ length: safeRows }).map((_, rowIndex) => (
          <div key={rowIndex} className={cn('grid gap-3 p-3', gridColsClassName)}>
            {Array.from({ length: safeColumns }).map((__, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn('h-4', colIndex === 0 ? 'w-3/4' : 'w-full')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

