import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import EmailView from './pages/EmailView'
import Drafts from './pages/Drafts'
import Settings from './pages/Settings'
import Budget from './pages/Budget'
import Rules from './pages/Rules'
import Analytics from './pages/Analytics'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
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
        </AppProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
