import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ClientTracker = lazy(() => import('@/pages/ClientTracker'))
const Features = lazy(() => import('@/pages/Features'))
const Migration = lazy(() => import('@/pages/Migration'))
const AdminPanel = lazy(() => import('@/pages/AdminPanel'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<ClientTracker />} />
        <Route path="/features" element={<Features />} />
        <Route path="/migration" element={<Migration />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
