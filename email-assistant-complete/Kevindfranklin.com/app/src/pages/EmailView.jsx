import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import { ArrowLeft, Star, Archive, Trash2, Sparkles, Send } from 'lucide-react'
import { format } from 'date-fns'

const EmailView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingDraft, setGeneratingDraft] = useState(false)

  useEffect(() => {
    fetchEmail()
  }, [id])

  const fetchEmail = async () => {
    try {
      const response = await axios.get(`/api/email/${id}`)
      setEmail(response.data.data.email)
    } catch (error) {
      console.error('Failed to fetch email:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateDraft = async () => {
    setGeneratingDraft(true)
    try {
      const response = await axios.post('/api/drafts/create', {
        email_id: id,
        tone: 'professional',
      })
      navigate('/drafts')
    } catch (error) {
      console.error('Failed to generate draft:', error)
    } finally {
      setGeneratingDraft(false)
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

  if (!email) {
    return (
      <Layout>
        <div className="p-6">
          <p>Email not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Back to Inbox</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={generateDraft}
                disabled={generatingDraft}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Sparkles size={18} />
                <span>{generatingDraft ? 'Generating...' : 'Generate Reply'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
            {/* Subject */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{email.subject}</h1>

            {/* Metadata */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
              <div>
                <p className="font-semibold text-gray-900">{email.from_name || email.from_address}</p>
                <p className="text-sm text-gray-600">{email.from_address}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(email.received_at), 'PPpp')}
                </p>
              </div>

              {email.priority_level && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  email.priority_level === 'critical' ? 'bg-red-100 text-red-700' :
                  email.priority_level === 'high' ? 'bg-orange-100 text-orange-700' :
                  email.priority_level === 'medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {email.priority_level.toUpperCase()}
                </span>
              )}
            </div>

            {/* AI Summary */}
            {email.summary && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">AI Summary</span>
                </div>
                <p className="text-sm text-purple-800">{email.summary}</p>

                {email.action_items && email.action_items.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-purple-900 mb-1">Action Items:</p>
                    <ul className="text-sm text-purple-800 space-y-1">
                      {email.action_items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{item.task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Body */}
            <div className="prose max-w-none">
              {email.body_html ? (
                <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{email.body_text}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default EmailView
