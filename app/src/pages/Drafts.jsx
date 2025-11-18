import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  FileText, Send, Trash2, Edit3, Mail, Sparkles,
  Clock, CheckCircle, XCircle, Eye
} from 'lucide-react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'

const Drafts = () => {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/drafts')
      setDrafts(response.data.data || [])
    } catch (error) {
      console.error('Failed to load drafts:', error)
      showMessage('error', 'Failed to load drafts')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleViewDraft = (draft) => {
    setSelectedDraft(draft)
    setEditedContent(draft.draft_content)
    setEditing(false)
  }

  const handleEditDraft = () => {
    setEditing(true)
  }

  const handleSaveDraft = async () => {
    try {
      await axios.patch(`/api/drafts/${selectedDraft.id}`, {
        draft_content: editedContent
      })
      showMessage('success', 'Draft saved successfully')
      setEditing(false)
      loadDrafts()
      // Update selected draft
      setSelectedDraft({ ...selectedDraft, draft_content: editedContent })
    } catch (error) {
      console.error('Failed to save draft:', error)
      showMessage('error', 'Failed to save draft')
    }
  }

  const handleSendDraft = async (draft) => {
    if (!confirm('Send this draft email? This will send the email from your connected account.')) {
      return
    }

    try {
      setSending(true)
      await axios.post(`/api/drafts/${draft.id}/send`)
      showMessage('success', 'Email sent successfully!')
      setSelectedDraft(null)
      loadDrafts()
    } catch (error) {
      console.error('Failed to send email:', error)
      showMessage('error', error.response?.data?.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteDraft = async (draftId) => {
    if (!confirm('Delete this draft? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/drafts/${draftId}`)
      showMessage('success', 'Draft deleted successfully')
      if (selectedDraft?.id === draftId) {
        setSelectedDraft(null)
      }
      loadDrafts()
    } catch (error) {
      console.error('Failed to delete draft:', error)
      showMessage('error', 'Failed to delete draft')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={14} />,
      sent: <CheckCircle size={14} />,
      failed: <XCircle size={14} />,
    }
    return icons[status] || <FileText size={14} />
  }

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Draft Emails</h1>
          <p className="text-gray-600">AI-generated email drafts ready for review and sending</p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drafts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  All Drafts ({drafts.length})
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading drafts...
                </div>
              ) : drafts.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">No drafts yet</p>
                  <p className="text-sm text-gray-500">
                    AI will generate draft replies for your important emails
                  </p>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                  {drafts.map((draft) => (
                    <button
                      key={draft.id}
                      onClick={() => handleViewDraft(draft)}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedDraft?.id === draft.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-purple-500" />
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(draft.status)}`}>
                            {getStatusIcon(draft.status)}
                            {draft.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          Re: {draft.original_subject || 'Email'}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {draft.draft_content.substring(0, 100)}...
                        </div>
                      </div>

                      {draft.confidence_score && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">Confidence:</span>
                          <span className={`font-medium ${getConfidenceColor(draft.confidence_score)}`}>
                            {(draft.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Draft Detail */}
          <div className="lg:col-span-2">
            {!selectedDraft ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Mail size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Select a draft to view and edit</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={20} className="text-purple-500" />
                        <h2 className="text-xl font-bold text-gray-900">
                          Re: {selectedDraft.original_subject || 'Email'}
                        </h2>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(selectedDraft.status)}`}>
                          {getStatusIcon(selectedDraft.status)}
                          {selectedDraft.status}
                        </span>
                        {selectedDraft.confidence_score && (
                          <span>
                            Confidence:{' '}
                            <span className={`font-medium ${getConfidenceColor(selectedDraft.confidence_score)}`}>
                              {(selectedDraft.confidence_score * 100).toFixed(0)}%
                            </span>
                          </span>
                        )}
                        <span>
                          Created {formatDistanceToNow(new Date(selectedDraft.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!editing && selectedDraft.status === 'pending' && (
                        <>
                          <button
                            onClick={handleEditDraft}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit draft"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleSendDraft(selectedDraft)}
                            disabled={sending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            <Send size={16} />
                            {sending ? 'Sending...' : 'Send'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteDraft(selectedDraft.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete draft"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {editing ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Edit Draft Content
                      </label>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={15}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleSaveDraft}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false)
                            setEditedContent(selectedDraft.draft_content)
                          }}
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {selectedDraft.draft_content}
                      </div>
                    </div>
                  )}
                </div>

                {/* Context */}
                {selectedDraft.context && (
                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Eye size={16} />
                      AI Context & Reasoning
                    </h3>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedDraft.context}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Drafts
