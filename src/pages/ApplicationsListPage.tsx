import { Button } from '@/shared/ui/button'
import { toast } from 'sonner'

export const ApplicationsListPage = () => {
  const handleCreateClick = () => {
    toast.message('Пока не реализовано', {
      description: 'Создание заявки будет в следующих пунктах roadmap.',
    })
  }

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

      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Пока без данных. Дальше подключим API и таблицу.
      </div>
    </section>
  )
}

