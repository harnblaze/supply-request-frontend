import { Toaster } from '@/shared/ui/sonner'
import { AppLayout } from '@/widgets/app-layout'
import { ApplicationDetailsPage } from '@/pages/ApplicationDetailsPage'
import { ApplicationsListPage } from '@/pages/ApplicationsListPage'
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

