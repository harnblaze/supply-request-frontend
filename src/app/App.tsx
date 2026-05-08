import { Toaster } from '@/shared/ui/sonner'
import { AppLayout } from '@/widgets/app-layout'
import { ApplicationDetailsPage } from '@/pages/ApplicationDetailsPage'
import { ApplicationCreatePage } from '@/pages/ApplicationCreatePage'
import { ApplicationEditPage } from '@/pages/ApplicationEditPage'
import { ApplicationsListPage } from '@/pages/ApplicationsListPage'
import { MaterialsPage } from '@/pages/MaterialsPage'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

const App = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ApplicationsListPage />} />
          <Route path="/applications/new" element={<ApplicationCreatePage />} />
          <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
          <Route path="/applications/:id/edit" element={<ApplicationEditPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <Toaster />
    </BrowserRouter>
  )
}

export default App

