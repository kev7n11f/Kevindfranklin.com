import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { DollarSign, TrendingUp, Activity } from 'lucide-react'

const Budget = () => {
  const { budget, updateBudget, fetchBudget } = useApp()
  const [newLimit, setNewLimit] = useState('')
  const [recentUsage, setRecentUsage] = useState([])

  useEffect(() => {
    fetchBudgetDetails()
  }, [])

  const fetchBudgetDetails = async () => {
    try {
      const response = await axios.get('/api/budget/status')
      setRecentUsage(response.data.data.recentUsage)
    } catch (error) {
      console.error('Failed to fetch budget details:', error)
    }
  }

  const handleUpdateLimit = async (e) => {
    e.preventDefault()
    const cents = Math.floor(parseFloat(newLimit) * 100)
    await updateBudget({ budget_limit_cents: cents })
    setNewLimit('')
  }

  const handleTogglePause = async () => {
    await updateBudget({ is_paused: !budget?.isPaused })
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Budget Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Current Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Current Usage</h3>
              <DollarSign className="text-primary-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${((budget?.estimatedCostCents || 0) / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              of ${((budget?.budgetLimitCents || 0) / 100).toFixed(2)} limit
            </p>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (budget?.percentUsed || 0) >= 90 ? 'bg-red-600' :
                  (budget?.percentUsed || 0) >= 80 ? 'bg-yellow-600' :
                  'bg-primary-600'
                }`}
                style={{ width: `${Math.min(budget?.percentUsed || 0, 100)}%` }}
              />
            </div>
          </div>

          {/* API Calls */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">API Calls</h3>
              <Activity className="text-purple-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {budget?.apiCallsTotal || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {budget?.apiCallsClaude || 0} Claude calls
            </p>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Status</h3>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {budget?.isPaused ? 'Paused' : 'Active'}
            </p>
            <button
              onClick={handleTogglePause}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {budget?.isPaused ? 'Resume' : 'Pause'} spending
            </button>
          </div>
        </div>

        {/* Update Limit */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Budget Limit</h2>
          <form onSubmit={handleUpdateLimit} className="flex gap-4">
            <input
              type="number"
              step="0.01"
              min="0"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder="Enter new limit in dollars"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Update Limit
            </button>
          </form>
        </div>

        {/* Recent Usage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent API Usage</h2>
          {recentUsage.length === 0 ? (
            <p className="text-gray-500">No recent usage</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operation</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentUsage.map((usage, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(usage.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{usage.operation}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {usage.tokens_input + usage.tokens_output}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        ${(usage.cost_cents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Budget
