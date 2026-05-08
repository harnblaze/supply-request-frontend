import { z } from 'zod'

const MAX_APPLICATION_NUMBER_LENGTH = 128
const MAX_COMMENT_LENGTH = 10_000
const MAX_WORD_FILE_SIZE_BYTES = 20 * 1024 * 1024

const hasAllowedWordExtension = (fileName: string) => /\.(doc|docx)$/i.test(fileName)

const wordFileSchema = z
  .custom<File | null | undefined>((value) => value === null || value === undefined || value instanceof File)
  .refine((file) => !file || hasAllowedWordExtension(file.name), {
    message: 'Поддерживаются только файлы .doc или .docx',
  })
  .refine((file) => !file || file.size <= MAX_WORD_FILE_SIZE_BYTES, {
    message: 'Файл слишком большой (макс. 20 МБ)',
  })

export const applicationEditorSchema = z.object({
  applicationNumber: z
    .string()
    .trim()
    .max(MAX_APPLICATION_NUMBER_LENGTH, `Максимум ${MAX_APPLICATION_NUMBER_LENGTH} символов`)
    .optional()
    .or(z.literal('')),
  comment: z
    .string()
    .trim()
    .max(MAX_COMMENT_LENGTH, `Максимум ${MAX_COMMENT_LENGTH} символов`)
    .optional()
    .or(z.literal('')),
  status: z.enum(['DRAFT', 'SENT_TO_SUPPLY']).optional(),
  wordFile: wordFileSchema.optional(),
})

export type ApplicationEditorFormValues = z.infer<typeof applicationEditorSchema>

