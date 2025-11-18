import { X, AlertCircle } from 'lucide-react'

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmStyle = 'danger' }) => {
  if (!isOpen) return null

  const confirmButtonClasses = confirmStyle === 'danger'
    ? 'px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
    : 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {confirmStyle === 'danger' && (
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={confirmButtonClasses}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmModal
