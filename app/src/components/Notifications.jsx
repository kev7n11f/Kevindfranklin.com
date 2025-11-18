import { useState, useEffect } from 'react'
import { Bell, X, Mail, Sparkles, AlertCircle, Check } from 'lucide-react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications')
      const data = response.data.data || []
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}`, { is_read: true })
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read')
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`)
      setNotifications(notifications.filter(n => n.id !== notificationId))
      const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read)
      if (wasUnread) setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getIcon = (type) => {
    const icons = {
      email: <Mail size={16} />,
      ai_analysis: <Sparkles size={16} />,
      budget: <AlertCircle size={16} />,
      system: <Bell size={16} />,
    }
    return icons[type] || icons.system
  }

  const getColor = (type) => {
    const colors = {
      email: 'bg-blue-100 text-blue-600',
      ai_analysis: 'bg-purple-100 text-purple-600',
      budget: 'bg-yellow-100 text-yellow-600',
      system: 'bg-gray-100 text-gray-600',
    }
    return colors[type] || colors.system
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-2 text-gray-400" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Mark as read"
                          >
                            <Check size={14} className="text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Delete"
                        >
                          <X size={14} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Notifications
