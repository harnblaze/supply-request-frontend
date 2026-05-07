import { useParams } from 'react-router-dom'

export const ApplicationDetailsPage = () => {
  const { id } = useParams()

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Детали заявки</h1>
      <p className="text-sm text-muted-foreground">ID: {id ?? '—'}</p>
    </section>
  )
}

