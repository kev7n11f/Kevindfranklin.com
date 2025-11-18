import Layout from '../components/Layout'
import { Settings as SettingsIcon } from 'lucide-react'

const Settings = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <SettingsIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Email account management coming soon</p>
          <p className="text-sm text-gray-500 mt-2">
            Connect Gmail, Outlook, iCloud, and Spacemail accounts here
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Settings
