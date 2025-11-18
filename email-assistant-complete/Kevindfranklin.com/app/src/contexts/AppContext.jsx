import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const { user } = useAuth()
  const [budget, setBudget] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchBudget()
    }
  }, [user])

  const fetchBudget = async () => {
    try {
      const response = await axios.get('/api/budget/status')
      setBudget(response.data.data.budget)
    } catch (error) {
      console.error('Failed to fetch budget:', error)
    }
  }

  const syncEmails = async (accountId = null) => {
    setSyncing(true)
    try {
      const response = await axios.post('/api/email/sync', {
        account_id: accountId,
      })
      return response.data
    } catch (error) {
      console.error('Email sync failed:', error)
      throw error
    } finally {
      setSyncing(false)
    }
  }

  const updateBudget = async (updates) => {
    try {
      await axios.patch('/api/budget/update', updates)
      await fetchBudget()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update budget',
      }
    }
  }

  const value = {
    budget,
    notifications,
    syncing,
    syncEmails,
    updateBudget,
    fetchBudget,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
