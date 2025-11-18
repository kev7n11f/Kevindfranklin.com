import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import Notifications from './Notifications'
import {
  Mail,
  FileText,
  Settings,
  DollarSign,
  LogOut,
  RefreshCw,
  AlertCircle,
  Zap,
  BarChart3,
  Keyboard,
} from 'lucide-react'

const Layout = ({ children }) => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { budget, syncing, syncEmails } = useApp()

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Mail },
    { name: 'Drafts', href: '/drafts', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Rules', href: '/rules', icon: Zap },
    { name: 'Budget', href: '/budget', icon: DollarSign },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isActive = (path) => location.pathname === path

  const handleSync = async () => {
    try {
      await syncEmails()
      // Show success notification
    } catch (error) {
      // Show error notification
    }
  }

  const budgetWarning = budget && budget.percentUsed >= 80

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Email Assistant
            </h1>
            <Notifications />
          </div>
          <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Budget Warning */}
        {budgetWarning && (
          <div className="p-4 mx-4 mb-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-medium text-yellow-800">Budget Alert</p>
                <p className="text-xs text-yellow-700 mt-1">
                  {budget.percentUsed}% of budget used
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync & Logout */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Emails'}</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

export default Layout
