type DateInput = string | number | Date | null | undefined

const toDate = (value: DateInput) => {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatDateRu = (value: DateInput) => {
  const date = toDate(value)
  if (!date) return '—'
  return dateFormatter.format(date)
}

export const formatDateTimeRu = (value: DateInput) => {
  const date = toDate(value)
  if (!date) return '—'
  return dateTimeFormatter.format(date)
}

