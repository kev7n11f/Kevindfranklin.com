import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import PrivateRoute from './components/PrivateRoute'

// Lazy load page components for better performance
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const EmailView = lazy(() => import('./pages/EmailView'))
const Drafts = lazy(() => import('./pages/Drafts'))
const Settings = lazy(() => import('./pages/Settings'))
const Budget = lazy(() => import('./pages/Budget'))
const Rules = lazy(() => import('./pages/Rules'))
const Analytics = lazy(() => import('./pages/Analytics'))

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          }>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/email/:id"
              element={
                <PrivateRoute>
                  <EmailView />
                </PrivateRoute>
              }
            />
            <Route
              path="/drafts"
              element={
                <PrivateRoute>
                  <Drafts />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <PrivateRoute>
                  <Budget />
                </PrivateRoute>
              }
            />
            <Route
              path="/rules"
              element={
                <PrivateRoute>
                  <Rules />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <Analytics />
                </PrivateRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AppProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
