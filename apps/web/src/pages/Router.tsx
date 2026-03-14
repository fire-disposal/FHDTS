import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useAuthStore } from '../stores/authStore'
import { Login } from './auth/Login'
import { Dashboard } from './dashboard/Dashboard'
import { UserManagement } from './users/UserManagement'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const userRole = useAuthStore(state => state.user?.role)

  if (!isAuthenticated) return <Navigate to="/login" />
  if (userRole !== 'ADMIN') return <Navigate to="/" />

  return <>{children}</>
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route
            path="users"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />

          <Route path="settings" element={<div>系统设置</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
