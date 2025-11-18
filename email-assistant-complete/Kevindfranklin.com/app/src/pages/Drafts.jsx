import Layout from '../components/Layout'
import { FileText } from 'lucide-react'

const Drafts = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Draft Emails</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Draft management interface coming soon</p>
          <p className="text-sm text-gray-500 mt-2">
            View and edit AI-generated email drafts here
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Drafts
