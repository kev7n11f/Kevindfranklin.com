import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import { Mail, Star, Archive, Filter, Search, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

const Dashboard = () => {
  const navigate = useNavigate()
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ priority: '', is_read: '', search: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 50 })

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
    } finally {
      setLoading(false)
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
              value={filter.is_read}
              onChange={(e) => setFilter({ ...filter, is_read: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
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
            <div className="divide-y divide-gray-200">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => navigate(`/email/${email.id}`)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !email.is_read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
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

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(email.received_at), 'MMM d, h:mm a')}
                      </span>
                      <div className="flex gap-1">
                        {email.is_starred && (
                          <Star size={16} className="text-yellow-500 fill-current" />
                        )}
                        {email.has_attachments && (
                          <Mail size={16} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
