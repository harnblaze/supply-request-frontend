import { z } from 'zod'

export const MAX_MATERIAL_NAME_LENGTH = 512

export const materialNameSchema = z
  .string()
  .trim()
  .min(1, 'Укажи наименование')
  .max(MAX_MATERIAL_NAME_LENGTH, `Максимум ${MAX_MATERIAL_NAME_LENGTH} символов`)

export const orderedQuantitySchema = z
  .number({ message: 'Укажи количество' })
  .refine((value) => Number.isInteger(value), 'Количество должно быть целым числом')
  .refine((value) => value >= 1, 'Количество должно быть больше 0')

export const deliveredQuantitySchema = z
  .number({ message: 'Укажи количество' })
  .refine((value) => Number.isInteger(value), 'Количество должно быть целым числом')
  .refine((value) => value >= 0, 'Количество должно быть не меньше 0')

