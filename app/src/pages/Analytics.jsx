import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  BarChart3, TrendingUp, Mail, Clock, Star, Tag,
  Users, Sparkles, Calendar, PieChart
} from 'lucide-react'
import axios from 'axios'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/analytics?range=${timeRange}`)
      setAnalytics(response.data.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  const stats = analytics?.overview || {}
  const categoryData = analytics?.byCategory || []
  const priorityData = analytics?.byPriority || []
  const topSenders = analytics?.topSenders || []
  const dailyActivity = analytics?.dailyActivity || []

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600">Insights into your email activity and AI usage</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Emails"
            value={stats.totalEmails || 0}
            icon={Mail}
            color="blue"
            trend={stats.emailTrend}
          />
          <StatCard
            title="AI Analyzed"
            value={stats.aiAnalyzed || 0}
            icon={Sparkles}
            color="purple"
            trend={stats.aiTrend}
          />
          <StatCard
            title="Avg Response Time"
            value={stats.avgResponseTime || 'N/A'}
            icon={Clock}
            color="green"
          />
          <StatCard
            title="Starred"
            value={stats.starred || 0}
            icon={Star}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* By Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Emails by Category</h2>
              <Tag size={20} className="text-gray-400" />
            </div>
            {categoryData.length > 0 ? (
              <div className="space-y-3">
                {categoryData.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 capitalize">{cat.category || 'Uncategorized'}</span>
                      <span className="font-medium text-gray-900">{cat.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(cat.count / stats.totalEmails) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>

          {/* By Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Emails by Priority</h2>
              <TrendingUp size={20} className="text-gray-400" />
            </div>
            {priorityData.length > 0 ? (
              <div className="space-y-3">
                {priorityData.map((priority) => {
                  const colors = {
                    critical: 'bg-red-600',
                    high: 'bg-orange-600',
                    medium: 'bg-blue-600',
                    low: 'bg-gray-600',
                  }
                  return (
                    <div key={priority.priority_level} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 capitalize">{priority.priority_level}</span>
                        <span className="font-medium text-gray-900">{priority.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${colors[priority.priority_level]} h-2 rounded-full transition-all`}
                          style={{ width: `${(priority.count / stats.totalEmails) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>
        </div>

        {/* Top Senders */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Senders</h2>
            <Users size={20} className="text-gray-400" />
          </div>
          {topSenders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sender</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email Count</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Unread</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Avg Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {topSenders.map((sender, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{sender.from_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{sender.from_address}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{sender.total}</td>
                      <td className="py-3 px-4 text-gray-700">{sender.unread}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          sender.avg_priority === 'critical' ? 'bg-red-100 text-red-700' :
                          sender.avg_priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          sender.avg_priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sender.avg_priority || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Daily Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Daily Email Activity</h2>
            <Calendar size={20} className="text-gray-400" />
          </div>
          {dailyActivity.length > 0 ? (
            <div className="space-y-2">
              {dailyActivity.map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-24">
                    {format(new Date(day.date), 'MMM d')}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-blue-600 h-6 flex items-center justify-end pr-2 text-white text-xs font-medium transition-all"
                          style={{ width: `${Math.min((day.count / Math.max(...dailyActivity.map(d => d.count))) * 100, 100)}%` }}
                        >
                          {day.count > 0 && day.count}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>
    </Layout>
  )
}

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

export default Analytics
