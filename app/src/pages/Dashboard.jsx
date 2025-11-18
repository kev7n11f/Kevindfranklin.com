import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import {
  Mail, Star, Archive, Filter, Search, Sparkles, Trash2,
  CheckSquare, Square, MailOpen, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

const Dashboard = () => {
  const navigate = useNavigate()
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmails, setSelectedEmails] = useState([])
  const [filter, setFilter] = useState({ priority: '', category: '', is_read: '', search: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 50 })
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchEmails()
  }, [filter, pagination.page])

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filter,
      })

      const response = await axios.get(`/api/email/list?${params}`)
      setEmails(response.data.data.emails)
      setPagination({ ...pagination, ...response.data.data.pagination })
    } catch (error) {
      console.error('Failed to fetch emails:', error)
      showActionMessage('error', 'Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  const showActionMessage = (type, text) => {
    setActionMessage({ type, text })
    setTimeout(() => setActionMessage({ type: '', text: '' }), 3000)
  }

  const toggleSelectEmail = (emailId) => {
    setSelectedEmails(prev =>
      prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(emails.map(e => e.id))
    }
  }

  const handleBatchAction = async (action) => {
    if (selectedEmails.length === 0) {
      showActionMessage('error', 'No emails selected')
      return
    }

    try {
      const actionMap = {
        'mark-read': { is_read: true },
        'mark-unread': { is_read: false },
        'star': { is_starred: true },
        'unstar': { is_starred: false },
        'archive': { is_archived: true },
      }

      if (action === 'delete') {
        if (!confirm(`Delete ${selectedEmails.length} email(s)? This action cannot be undone.`)) {
          return
        }

        await Promise.all(
          selectedEmails.map(id => axios.delete(`/api/email/${id}`))
        )
        showActionMessage('success', `${selectedEmails.length} email(s) deleted`)
      } else {
        await Promise.all(
          selectedEmails.map(id =>
            axios.patch(`/api/email/${id}`, actionMap[action])
          )
        )
        const actionLabels = {
          'mark-read': 'marked as read',
          'mark-unread': 'marked as unread',
          'star': 'starred',
          'unstar': 'unstarred',
          'archive': 'archived',
        }
        showActionMessage('success', `${selectedEmails.length} email(s) ${actionLabels[action]}`)
      }

      setSelectedEmails([])
      fetchEmails()
    } catch (error) {
      console.error('Batch action failed:', error)
      showActionMessage('error', 'Action failed')
    }
  }

  const handleQuickAction = async (emailId, action, event) => {
    event.stopPropagation()

    try {
      const actionMap = {
        'toggle-star': (email) => ({ is_starred: !email.is_starred }),
        'toggle-read': (email) => ({ is_read: !email.is_read }),
        'archive': () => ({ is_archived: true }),
      }

      const email = emails.find(e => e.id === emailId)
      await axios.patch(`/api/email/${emailId}`, actionMap[action](email))

      // Update local state
      setEmails(emails.map(e =>
        e.id === emailId
          ? { ...e, ...actionMap[action](email) }
          : e
      ))
    } catch (error) {
      console.error('Quick action failed:', error)
      showActionMessage('error', 'Action failed')
    }
  }

  const getPriorityColor = (level) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'medium':
        return 'text-blue-600 bg-blue-50'
      case 'low':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getCategoryIcon = (category) => {
    return category || 'general'
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>

          {/* Action Message */}
          {actionMessage.text && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              actionMessage.type === 'success' ? 'bg-green-50 text-green-800' :
              'bg-red-50 text-red-800'
            }`}>
              {actionMessage.text}
            </div>
          )}

          {/* Filters */}
          <div className="mt-4 flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search emails..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="finance">Finance</option>
              <option value="newsletter">Newsletter</option>
              <option value="promotional">Promotional</option>
              <option value="social">Social</option>
            </select>

            <select
              value={filter.is_read}
              onChange={(e) => setFilter({ ...filter, is_read: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>

            <button
              onClick={fetchEmails}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
          </div>

          {/* Batch Actions */}
          {selectedEmails.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedEmails.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBatchAction('mark-read')}
                  className="px-3 py-1 text-sm bg-white border border-blue-200 text-blue-700 rounded hover:bg-blue-50"
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleBatchAction('mark-unread')}
                  className="px-3 py-1 text-sm bg-white border border-blue-200 text-blue-700 rounded hover:bg-blue-50"
                >
                  Mark Unread
                </button>
                <button
                  onClick={() => handleBatchAction('star')}
                  className="px-3 py-1 text-sm bg-white border border-blue-200 text-blue-700 rounded hover:bg-blue-50"
                >
                  Star
                </button>
                <button
                  onClick={() => handleBatchAction('archive')}
                  className="px-3 py-1 text-sm bg-white border border-blue-200 text-blue-700 rounded hover:bg-blue-50"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBatchAction('delete')}
                  className="px-3 py-1 text-sm bg-white border border-red-200 text-red-700 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
              <button
                onClick={() => setSelectedEmails([])}
                className="ml-auto text-sm text-blue-700 hover:text-blue-900"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Mail size={48} className="mb-4" />
              <p>No emails found</p>
              <p className="text-sm mt-2">Try syncing your accounts or adjusting filters</p>
            </div>
          ) : (
            <div>
              {/* Select All */}
              <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {selectedEmails.length === emails.length ? (
                    <CheckSquare size={20} className="text-blue-600" />
                  ) : (
                    <Square size={20} className="text-gray-400" />
                  )}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedEmails.length === emails.length ? 'Deselect all' : 'Select all'}
                </span>
              </div>

              <div className="divide-y divide-gray-200">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !email.is_read ? 'bg-blue-50/30' : ''
                    } ${selectedEmails.includes(email.id) ? 'bg-blue-100/50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelectEmail(email.id)
                        }}
                        className="p-1 hover:bg-gray-200 rounded mt-1"
                      >
                        {selectedEmails.includes(email.id) ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} className="text-gray-400" />
                        )}
                      </button>

                      {/* Email Content */}
                      <div
                        onClick={() => navigate(`/email/${email.id}`)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {!email.is_read && (
                            <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                          )}
                          <span className="font-semibold text-gray-900">
                            {email.from_name || email.from_address}
                          </span>
                          {email.ai_analyzed_at && (
                            <Sparkles size={14} className="text-purple-500" />
                          )}
                          {email.priority_level && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(email.priority_level)}`}>
                              {email.priority_level}
                            </span>
                          )}
                          {email.category && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                              {getCategoryIcon(email.category)}
                            </span>
                          )}
                        </div>

                        <h3 className={`text-sm ${!email.is_read ? 'font-semibold' : ''} text-gray-900 truncate`}>
                          {email.subject}
                        </h3>

                        {email.summary && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {email.summary}
                          </p>
                        )}

                        {!email.summary && email.snippet && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {email.snippet}
                          </p>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {format(new Date(email.received_at), 'MMM d, h:mm a')}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => handleQuickAction(email.id, 'toggle-star', e)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title={email.is_starred ? 'Unstar' : 'Star'}
                          >
                            <Star
                              size={16}
                              className={email.is_starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}
                            />
                          </button>
                          <button
                            onClick={(e) => handleQuickAction(email.id, 'toggle-read', e)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title={email.is_read ? 'Mark unread' : 'Mark read'}
                          >
                            <MailOpen size={16} className="text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => handleQuickAction(email.id, 'archive', e)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Archive"
                          >
                            <Archive size={16} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
