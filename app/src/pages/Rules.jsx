import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import {
  Plus, Edit3, Trash2, ToggleRight, Zap, Filter, Mail,
  ArrowRight, Save, X
} from 'lucide-react'
import axios from 'axios'

const Rules = () => {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, ruleId: null })

  const [formData, setFormData] = useState({
    name: '',
    enabled: true,
    conditions: [{ field: 'from', operator: 'contains', value: '' }],
    actions: [{ type: 'set_category', value: '' }],
  })

  const conditionFields = [
    { value: 'from', label: 'From (email address)' },
    { value: 'subject', label: 'Subject' },
    { value: 'body', label: 'Body' },
    { value: 'to', label: 'To' },
    { value: 'has_attachments', label: 'Has attachments' },
  ]

  const operators = [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
  ]

  const actionTypes = [
    { value: 'set_category', label: 'Set category' },
    { value: 'set_priority', label: 'Set priority' },
    { value: 'mark_read', label: 'Mark as read' },
    { value: 'star', label: 'Star email' },
    { value: 'archive', label: 'Archive' },
    { value: 'delete', label: 'Delete' },
    { value: 'skip_ai_analysis', label: 'Skip AI analysis' },
  ]

  const categories = ['work', 'personal', 'finance', 'newsletter', 'promotional', 'social']
  const priorities = ['critical', 'high', 'medium', 'low']

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/rules')
      setRules(response.data.data || [])
    } catch (error) {
      console.error('Failed to load rules:', error)
      showMessage('error', 'Failed to load rules')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleAddCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: 'from', operator: 'contains', value: '' }]
    })
  }

  const handleRemoveCondition = (index) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    })
  }

  const handleUpdateCondition = (index, field, value) => {
    const newConditions = [...formData.conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setFormData({ ...formData, conditions: newConditions })
  }

  const handleAddAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'set_category', value: '' }]
    })
  }

  const handleRemoveAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    })
  }

  const handleUpdateAction = (index, field, value) => {
    const newActions = [...formData.actions]
    newActions[index] = { ...newActions[index], [field]: value }
    setFormData({ ...formData, actions: newActions })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingRule) {
        await axios.patch(`/api/rules/${editingRule.id}`, formData)
        showMessage('success', 'Rule updated successfully')
      } else {
        await axios.post('/api/rules', formData)
        showMessage('success', 'Rule created successfully')
      }

      setShowForm(false)
      setEditingRule(null)
      resetForm()
      loadRules()
    } catch (error) {
      console.error('Failed to save rule:', error)
      showMessage('error', 'Failed to save rule')
    }
  }

  const handleEdit = (rule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      enabled: rule.enabled,
      conditions: rule.conditions,
      actions: rule.actions,
    })
    setShowForm(true)
  }

  const handleDelete = (ruleId) => {
    setConfirmDelete({ isOpen: true, ruleId })
  }

  const confirmDeleteRule = async () => {
    const { ruleId } = confirmDelete
    setConfirmDelete({ isOpen: false, ruleId: null })

    try {
      await axios.delete(`/api/rules/${ruleId}`)
      showMessage('success', 'Rule deleted successfully')
      loadRules()
    } catch (error) {
      console.error('Failed to delete rule:', error)
      showMessage('error', 'Failed to delete rule')
    }
  }

  const cancelDelete = () => {
    setConfirmDelete({ isOpen: false, ruleId: null })
  }

  const handleToggle = async (rule) => {
    try {
      await axios.patch(`/api/rules/${rule.id}`, { enabled: !rule.enabled })
      loadRules()
    } catch (error) {
      console.error('Failed to toggle rule:', error)
      showMessage('error', 'Failed to toggle rule')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      enabled: true,
      conditions: [{ field: 'from', operator: 'contains', value: '' }],
      actions: [{ type: 'set_category', value: '' }],
    })
  }

  const getActionLabel = (action) => {
    const type = actionTypes.find(t => t.value === action.type)
    return `${type?.label}: ${action.value || 'N/A'}`
  }

  return (
    <Layout>
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Delete Rule"
        message="Delete this rule? This action cannot be undone."
        onConfirm={confirmDeleteRule}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="danger"
      />
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Rules</h1>
              <p className="text-gray-600">Automate email management with custom rules</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setEditingRule(null)
                setShowForm(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              New Rule
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Rule Form */}
        {showForm && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRule ? 'Edit Rule' : 'Create New Rule'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingRule(null)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Archive newsletters"
                />
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    When email matches...
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add condition
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <select
                        value={condition.field}
                        onChange={(e) => handleUpdateCondition(index, 'field', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {conditionFields.map(field => (
                          <option key={field.value} value={field.value}>{field.label}</option>
                        ))}
                      </select>

                      <select
                        value={condition.operator}
                        onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        required
                        value={condition.value}
                        onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Value..."
                      />

                      {formData.conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Perform these actions...
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add action
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <select
                        value={action.type}
                        onChange={(e) => handleUpdateAction(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {actionTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>

                      {(action.type === 'set_category' || action.type === 'set_priority') && (
                        <select
                          value={action.value}
                          onChange={(e) => handleUpdateAction(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          {(action.type === 'set_category' ? categories : priorities).map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      )}

                      {formData.actions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={16} />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingRule(null)
                    resetForm()
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rules List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading rules...
            </div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center">
              <Zap size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No rules created yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Create rules to automatically organize and manage your emails
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Rule
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rule.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Filter size={14} />
                          <span className="font-medium">Conditions:</span>
                          <span>
                            {rule.conditions.map((c, i) => (
                              <span key={i}>
                                {i > 0 && ' AND '}
                                {c.field} {c.operator} "{c.value}"
                              </span>
                            ))}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ArrowRight size={14} />
                          <span className="font-medium">Actions:</span>
                          <span>
                            {rule.actions.map((a, i) => (
                              <span key={i}>
                                {i > 0 && ', '}
                                {getActionLabel(a)}
                              </span>
                            ))}
                          </span>
                        </div>

                        {rule.applied_count > 0 && (
                          <div className="text-xs text-gray-500">
                            Applied {rule.applied_count} times
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleToggle(rule)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title={rule.enabled ? 'Disable' : 'Enable'}
                      >
                        <ToggleRight
                          size={18}
                          className={rule.enabled ? 'text-green-600' : 'text-gray-400'}
                        />
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Edit"
                      >
                        <Edit3 size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Rules
