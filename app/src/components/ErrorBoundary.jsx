import { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                <p className="text-gray-600">We're sorry for the inconvenience</p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-mono text-gray-700 mb-2">
                  {this.state.error.toString()}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="text-xs text-gray-600 mt-2">
                    <summary className="cursor-pointer hover:text-gray-900">
                      Stack trace
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Go to Dashboard
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-4 text-center">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
