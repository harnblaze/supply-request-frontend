import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/layout/AppLayout'
import { ApplicationsListPage } from '@/pages/ApplicationsListPage'
import { ApplicationDetailsPage } from '@/pages/ApplicationDetailsPage'
import { MaterialsPage } from '@/pages/MaterialsPage'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

const App = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ApplicationsListPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
