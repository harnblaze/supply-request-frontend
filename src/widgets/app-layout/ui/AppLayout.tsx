import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

interface AppLayoutProps {
  children: ReactNode
}

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) => {
  return [
    'inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors',
    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
  ].join(' ')
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold tracking-tight">Supply Request</div>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Основная навигация">
              <NavLink to="/" className={getNavLinkClassName} end>
                Заявки
              </NavLink>
              <NavLink to="/materials" className={getNavLinkClassName}>
                Материалы
              </NavLink>
            </nav>
          </div>

          <nav className="flex items-center gap-1 sm:hidden" aria-label="Основная навигация (мобильная)">
            <NavLink to="/" className={getNavLinkClassName} end>
              Заявки
            </NavLink>
            <NavLink to="/materials" className={getNavLinkClassName}>
              Материалы
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}

