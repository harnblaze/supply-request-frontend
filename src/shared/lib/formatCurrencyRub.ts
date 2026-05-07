type CurrencyInput = number | string | null | undefined

const parseCurrencyNumber = (value: CurrencyInput) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const normalized = value.replace(/\s+/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatCurrencyRub = (amount: CurrencyInput) => {
  const value = parseCurrencyNumber(amount)
  if (value === null) return '—'
  return rubFormatter.format(value)
}

