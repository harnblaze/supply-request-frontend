import { z } from 'zod'

import {
  deliveredQuantitySchema,
  materialNameSchema,
  orderedQuantitySchema,
} from './materialFormSchema'

export const addMaterialSchema = z
  .object({
    name: materialNameSchema,
    orderedQuantity: orderedQuantitySchema,
    deliveredQuantity: deliveredQuantitySchema,
  })
  .superRefine((values, ctx) => {
    if (values.deliveredQuantity > values.orderedQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deliveredQuantity'],
        message: 'Поставлено не может быть больше, чем заказано',
      })
    }
  })

export type AddMaterialFormValues = z.infer<typeof addMaterialSchema>

