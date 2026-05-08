import { z } from 'zod'

const MAX_SUPPLIER_LENGTH = 256

export const normalizeDecimalInput = (value: string) => value.trim().replace(',', '.')

export const isStrictDecimalString = (value: string) => {
  const normalized = normalizeDecimalInput(value)
  if (normalized.length === 0) return false
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return false
  return Number.isFinite(Number(normalized))
}

export const invoiceSupplierSchema = z
  .string()
  .trim()
  .min(1, 'Укажи поставщика')
  .max(MAX_SUPPLIER_LENGTH, `Максимум ${MAX_SUPPLIER_LENGTH} символов`)

export const invoiceAmountSchema = z
  .string()
  .transform((value) => normalizeDecimalInput(value))
  .refine((value) => isStrictDecimalString(value), {
    message: 'Сумма должна быть числом (например 12345.67)',
  })

