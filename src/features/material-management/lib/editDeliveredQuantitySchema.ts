import { z } from 'zod'

import { deliveredQuantitySchema } from './materialFormSchema'

export const editDeliveredQuantitySchema = z.object({
  deliveredQuantity: deliveredQuantitySchema,
})

export type EditDeliveredQuantityFormValues = z.infer<typeof editDeliveredQuantitySchema>

