import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import {
  ArrowLeft, Star, Archive, Trash2, Sparkles, Send, Reply,
  Paperclip, Tag, TrendingUp, AlertCircle, Mail, Edit3
} from 'lucide-react'
import { format } from 'date-fns'

const EmailView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchEmail()
  }, [id])

  const fetchEmail = async () => {
    try {
      const response = await axios.get(`/api/email/${id}`)
      setEmail(response.data.data.email)
    } catch (error) {
      console.error('Failed to fetch email:', error)
      showMessage('error', 'Failed to load email')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const generateDraft = async () => {
    setGeneratingDraft(true)
    try {
      await axios.post('/api/drafts/create', {
        email_id: id,
        tone: 'professional',
      })
      showMessage('success', 'Draft generated! View it in the Drafts page.')
      setTimeout(() => navigate('/drafts'), 2000)
    } catch (error) {
      console.error('Failed to generate draft:', error)
      showMessage('error', 'Failed to generate draft')
    } finally {
      setGeneratingDraft(false)
    }
  }

  const handleQuickAction = async (action) => {
    try {
      const actionMap = {
        'toggle-star': { is_starred: !email.is_starred },
        'archive': { is_archived: true },
      }

      await axios.patch(`/api/email/${id}`, actionMap[action])
      setEmail({ ...email, ...actionMap[action] })

      if (action === 'archive') {
        showMessage('success', 'Email archived')
        setTimeout(() => navigate('/dashboard'), 1500)
      }
    } catch (error) {
      console.error('Action failed:', error)
      showMessage('error', 'Action failed')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this email? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/email/${id}`)
      showMessage('success', 'Email deleted')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (error) {
      console.error('Delete failed:', error)
      showMessage('error', 'Failed to delete email')
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      showMessage('error', 'Please enter a reply message')
      return
    }

    setSendingReply(true)
    try {
      // Create a draft first
      const draftResponse = await axios.post('/api/drafts/create', {
        email_id: id,
        draft_content: replyText,
        skip_ai: true,
      })

      // Send it immediately
      await axios.post(`/api/drafts/${draftResponse.data.data.id}/send`)

      showMessage('success', 'Reply sent successfully!')
      setShowReplyForm(false)
      setReplyText('')
    } catch (error) {
      console.error('Failed to send reply:', error)
      showMessage('error', error.response?.data?.message || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'text-green-600 bg-green-50',
      neutral: 'text-gray-600 bg-gray-50',
      negative: 'text-red-600 bg-red-50',
      urgent: 'text-orange-600 bg-orange-50',
    }
    return colors[sentiment] || 'text-gray-600 bg-gray-50'
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
        <div className="p-6 text-center">
          <Mail size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Email not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Inbox
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Back to Inbox</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleQuickAction('toggle-star')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title={email.is_starred ? 'Unstar' : 'Star'}
              >
                <Star
                  size={20}
                  className={email.is_starred ? 'text-yellow-500 fill-current' : 'text-gray-600'}
                />
              </button>
              <button
                onClick={() => handleQuickAction('archive')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Archive"
              >
                <Archive size={20} className="text-gray-600" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Delete"
              >
                <Trash2 size={20} className="text-red-600" />
              </button>
            </div>
          </div>

          {/* Message Banner */}
          {message.text && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-800' :
              'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Main Email Card */}
            <div className="bg-white rounded-lg shadow p-8">
              {/* Subject */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{email.subject}</h1>

              {/* Metadata */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-200 mb-6">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{email.from_name || email.from_address}</p>
                  <p className="text-sm text-gray-600">{email.from_address}</p>
                  {email.to_address && (
                    <p className="text-sm text-gray-500 mt-1">To: {email.to_address}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(email.received_at), 'PPpp')}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
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
                  {email.category && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                      <Tag size={14} />
                      {email.category}
                    </span>
                  )}
                  {email.sentiment && (
                    <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getSentimentColor(email.sentiment)}`}>
                      <TrendingUp size={14} />
                      {email.sentiment}
                    </span>
                  )}
                </div>
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
                            <span>{item.task || item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {email.key_points && email.key_points.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-purple-900 mb-1">Key Points:</p>
                      <ul className="text-sm text-purple-800 space-y-1">
                        {email.key_points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {email.has_attachments && email.attachments && email.attachments.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {email.attachments.map((attachment, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                        <Paperclip size={14} />
                        <span>{attachment.filename || `Attachment ${idx + 1}`}</span>
                        {attachment.size && (
                          <span className="text-xs text-gray-500">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="prose max-w-none">
                {email.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                    {email.body_text}
                  </pre>
                )}
              </div>
            </div>

            {/* Reply Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Reply to this email</h3>

              {!showReplyForm ? (
                <div className="flex gap-3">
                  <button
                    onClick={generateDraft}
                    disabled={generatingDraft}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Sparkles size={18} />
                    <span>{generatingDraft ? 'Generating AI Reply...' : 'Generate AI Reply'}</span>
                  </button>
                  <button
                    onClick={() => setShowReplyForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit3 size={18} />
                    <span>Write Manual Reply</span>
                  </button>
                </div>
              ) : (
                <div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send size={16} />
                      <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowReplyForm(false)
                        setReplyText('')
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default EmailView
