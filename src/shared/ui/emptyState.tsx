import React from 'react'

import { cn } from '@/shared/lib'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className,
}) => {
  return (
    <section
      className={cn('rounded-lg border bg-card p-6 text-card-foreground', className)}
      aria-label={title}
    >
      <div className="space-y-2">
        <h2 className="text-base font-semibold leading-none tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  )
}

