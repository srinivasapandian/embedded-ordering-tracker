import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/components/auth/LoginPage'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ClientTracker = lazy(() => import('@/pages/ClientTracker'))
const MasterTracker = lazy(() => import('@/pages/MasterTracker'))
const AdminPanel = lazy(() => import('@/pages/AdminPanel'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<ClientTracker />} />
        <Route path="/master-tracker" element={<MasterTracker />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
