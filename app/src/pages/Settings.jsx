import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import {
  Mail, Plus, Trash2, RefreshCw, Save, User, Bell,
  Shield, Zap, Settings as SettingsIcon
} from 'lucide-react'
import axios from 'axios'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('accounts')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [confirmDisconnect, setConfirmDisconnect] = useState({ isOpen: false, accountId: null })

  // User settings state
  const [userSettings, setUserSettings] = useState({
    emailNotifications: true,
    autoAnalyze: true,
    autoDraft: false,
  })

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: ''
  })

  useEffect(() => {
    loadAccounts()
    loadUserProfile()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/email/accounts')
      setAccounts(response.data.data || [])
    } catch (error) {
      console.error('Failed to load accounts:', error)
      showMessage('error', 'Failed to load email accounts')
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      const user = response.data.data
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || ''
      })
      setUserSettings(user.settings || {
        emailNotifications: true,
        autoAnalyze: true,
        autoDraft: false,
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleConnectAccount = (provider) => {
    if (provider === 'gmail') {
      window.location.href = '/api/email/connect/gmail'
    } else if (provider === 'outlook') {
      window.location.href = '/api/email/connect/outlook'
    } else {
      // For IMAP providers (iCloud, Spacemail), show modal
      setActiveTab('add-imap')
    }
  }

  const handleDisconnectAccount = (accountId) => {
    setConfirmDisconnect({ isOpen: true, accountId })
  }

  const confirmDisconnectAccount = async () => {
    const { accountId } = confirmDisconnect
    setConfirmDisconnect({ isOpen: false, accountId: null })

    try {
      await axios.delete(`/api/email/accounts/${accountId}`)
      showMessage('success', 'Account disconnected successfully')
      loadAccounts()
    } catch (error) {
      console.error('Failed to disconnect account:', error)
      showMessage('error', 'Failed to disconnect account')
    }
  }

  const cancelDisconnect = () => {
    setConfirmDisconnect({ isOpen: false, accountId: null })
  }

  const handleSyncAccount = async (accountId) => {
    try {
      showMessage('info', 'Syncing emails...')
      await axios.post('/api/email/sync', { account_id: accountId })
      showMessage('success', 'Sync completed successfully')
      loadAccounts()
    } catch (error) {
      console.error('Sync failed:', error)
      showMessage('error', 'Sync failed')
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await axios.patch('/api/auth/profile', profileData)
      showMessage('success', 'Profile updated successfully')
    } catch (error) {
      console.error('Failed to save profile:', error)
      showMessage('error', 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      await axios.patch('/api/auth/settings', { settings: userSettings })
      showMessage('success', 'Settings updated successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      showMessage('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const getProviderIcon = (provider) => {
    const icons = {
      gmail: '📧',
      outlook: '📨',
      icloud: '☁️',
      spacemail: '🚀'
    }
    return icons[provider] || '📬'
  }

  const getProviderName = (provider) => {
    const names = {
      gmail: 'Gmail',
      outlook: 'Outlook',
      icloud: 'iCloud Mail',
      spacemail: 'Spacemail'
    }
    return names[provider] || provider
  }

  return (
    <Layout>
      <ConfirmModal
        isOpen={confirmDisconnect.isOpen}
        title="Disconnect Account"
        message="Are you sure you want to disconnect this account? Your email data will be preserved."
        onConfirm={confirmDisconnectAccount}
        onCancel={cancelDisconnect}
        confirmText="Disconnect"
        cancelText="Cancel"
        confirmStyle="danger"
      />
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Message Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'accounts'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Mail className="inline-block mr-2" size={16} />
                Email Accounts
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="inline-block mr-2" size={16} />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'preferences'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <SettingsIcon className="inline-block mr-2" size={16} />
                Preferences
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Email Accounts Tab */}
            {activeTab === 'accounts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Connected Email Accounts</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnectAccount('gmail')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Account
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No email accounts connected yet</p>
                    <div className="flex justify-center gap-3 flex-wrap">
                      <button
                        onClick={() => handleConnectAccount('gmail')}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        📧 Connect Gmail
                      </button>
                      <button
                        onClick={() => handleConnectAccount('outlook')}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        📨 Connect Outlook
                      </button>
                      <button
                        onClick={() => setActiveTab('add-imap')}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        ☁️ Connect iCloud
                      </button>
                      <button
                        onClick={() => setActiveTab('add-imap')}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        🚀 Connect Spacemail
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{getProviderIcon(account.provider)}</div>
                          <div>
                            <h3 className="font-medium text-gray-900">{account.email}</h3>
                            <p className="text-sm text-gray-500">
                              {getProviderName(account.provider)} •
                              Last synced: {account.last_sync ? new Date(account.last_sync).toLocaleString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSyncAccount(account.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Sync now"
                          >
                            <RefreshCw size={18} />
                          </button>
                          <button
                            onClick={() => handleDisconnectAccount(account.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Disconnect"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="max-w-2xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Email & AI Preferences</h2>
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell size={18} className="text-gray-600" />
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Receive notifications for important emails and updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings.emailNotifications}
                        onChange={(e) => setUserSettings({ ...userSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={18} className="text-gray-600" />
                        <h3 className="font-medium text-gray-900">Auto-Analyze Emails</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Automatically analyze new emails with AI for priority and categories
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings.autoAnalyze}
                        onChange={(e) => setUserSettings({ ...userSettings, autoAnalyze: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield size={18} className="text-gray-600" />
                        <h3 className="font-medium text-gray-900">Auto-Generate Drafts</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Automatically create reply drafts for important emails (requires your approval before sending)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings.autoDraft}
                        onChange={(e) => setUserSettings({ ...userSettings, autoDraft: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add IMAP Account Tab */}
            {activeTab === 'add-imap' && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    ← Back to accounts
                  </button>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Add IMAP/SMTP Account</h2>
                <IMAPAccountForm
                  onSuccess={() => {
                    setActiveTab('accounts')
                    loadAccounts()
                    showMessage('success', 'Account connected successfully')
                  }}
                  onCancel={() => setActiveTab('accounts')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// IMAP Account Form Component
const IMAPAccountForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    provider: 'icloud',
    email: '',
    password: '',
    imap_host: '',
    imap_port: '993',
    smtp_host: '',
    smtp_port: '587',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const presets = {
    icloud: {
      imap_host: 'imap.mail.me.com',
      imap_port: '993',
      smtp_host: 'smtp.mail.me.com',
      smtp_port: '587',
    },
    spacemail: {
      imap_host: 'imap.spacemail.com',
      imap_port: '993',
      smtp_host: 'smtp.spacemail.com',
      smtp_port: '587',
    },
  }

  const handleProviderChange = (provider) => {
    setFormData({
      ...formData,
      provider,
      ...presets[provider]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await axios.post('/api/email/connect/imap', formData)
      onSuccess()
    } catch (err) {
      console.error('Failed to connect account:', err)
      setError(err.response?.data?.message || 'Failed to connect account. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Provider
        </label>
        <select
          value={formData.provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="icloud">iCloud Mail</option>
          <option value="spacemail">Spacemail</option>
          <option value="custom">Custom IMAP/SMTP</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password / App-Specific Password
        </label>
        <input
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          For iCloud, use an app-specific password from appleid.apple.com
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IMAP Host
          </label>
          <input
            type="text"
            required
            value={formData.imap_host}
            onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IMAP Port
          </label>
          <input
            type="number"
            required
            value={formData.imap_port}
            onChange={(e) => setFormData({ ...formData, imap_port: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Host
          </label>
          <input
            type="text"
            required
            value={formData.smtp_host}
            onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Port
          </label>
          <input
            type="number"
            required
            value={formData.smtp_port}
            onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Connecting...' : 'Connect Account'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default Settings
