import { toast } from 'sonner'

type ToastOptions = {
  description?: string
}

export const toastSuccess = (title: string, options?: ToastOptions) => {
  toast.success(title, { description: options?.description })
}

export const toastInfo = (title: string, options?: ToastOptions) => {
  toast.info(title, { description: options?.description })
}

export const toastWarning = (title: string, options?: ToastOptions) => {
  toast.warning(title, { description: options?.description })
}

export const toastError = (title: string, options?: ToastOptions) => {
  toast.error(title, { description: options?.description })
}

