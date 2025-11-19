import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { FileText, Plus, Edit2, Trash2, Copy, Check } from 'lucide-react'
import axios from 'axios'

const Templates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'general',
    tone: 'professional',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/templates')
      setTemplates(response.data.templates || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      showMessage('error', 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingTemplate) {
        await axios.patch(`/api/templates/${editingTemplate.id}`, formData)
        showMessage('success', 'Template updated successfully')
      } else {
        await axios.post('/api/templates', formData)
        showMessage('success', 'Template created successfully')
      }

      setShowModal(false)
      setFormData({ name: '', subject: '', body: '', category: 'general', tone: 'professional' })
      setEditingTemplate(null)
      loadTemplates()
    } catch (error) {
      console.error('Failed to save template:', error)
      showMessage('error', 'Failed to save template')
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject || '',
      body: template.body,
      category: template.category,
      tone: template.tone,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      await axios.delete(`/api/templates/${id}`)
      showMessage('success', 'Template deleted successfully')
      loadTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      showMessage('error', 'Failed to delete template')
    }
  }

  const handleUseTemplate = async (id) => {
    try {
      const response = await axios.post(`/api/templates/use/${id}`, {})
      const template = response.data.template

      // Navigate to drafts with the template data
      window.location.href = `/drafts?template=${id}&subject=${encodeURIComponent(template.subject || '')}&body=${encodeURIComponent(template.body)}`
    } catch (error) {
      console.error('Failed to use template:', error)
      showMessage('error', 'Failed to use template')
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-700',
      work: 'bg-blue-100 text-blue-700',
      personal: 'bg-purple-100 text-purple-700',
      sales: 'bg-green-100 text-green-700',
      support: 'bg-yellow-100 text-yellow-700',
    }
    return colors[category] || colors.general
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600 mt-1">Create and manage reusable email templates</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null)
              setFormData({ name: '', subject: '', body: '', category: 'general', tone: 'professional' })
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Template</span>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-4">Create your first email template to save time</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    {template.subject && (
                      <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                  {template.body}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Tone: {template.tone}</span>
                  <span>Used {template.usage_count || 0} times</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <Copy size={16} />
                    Use
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Meeting Follow-up"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="general">General</option>
                          <option value="work">Work</option>
                          <option value="personal">Personal</option>
                          <option value="sales">Sales</option>
                          <option value="support">Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tone
                        </label>
                        <select
                          value={formData.tone}
                          onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="professional">Professional</option>
                          <option value="friendly">Friendly</option>
                          <option value="formal">Formal</option>
                          <option value="casual">Casual</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Following up on our meeting"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Body *
                      </label>
                      <textarea
                        required
                        rows={10}
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                        placeholder="Use {{variable_name}} for variables, e.g., Hi {{name}}"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tip: Use {'{{variable}}'} syntax for dynamic content
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Check size={20} />
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditingTemplate(null)
                        setFormData({ name: '', subject: '', body: '', category: 'general', tone: 'professional' })
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Templates
