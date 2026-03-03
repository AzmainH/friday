import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  requestId?: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const requestId = (error as Error & { requestId?: string }).requestId
    return { hasError: true, error, requestId }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, requestId: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-50">
          <div className="max-w-md text-center px-6">
            <p className="text-[4rem] font-extrabold text-text-tertiary/30 mb-2">
              Oops
            </p>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-text-secondary mb-1">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            {this.state.requestId && (
              <p className="text-xs text-text-tertiary mb-6">
                Request ID: {this.state.requestId}
              </p>
            )}
            <div className="flex gap-3 justify-center mt-6">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-[--radius-sm] bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
              >
                Go Home
              </a>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center px-4 py-2 rounded-[--radius-sm] border border-surface-200 text-text-primary font-semibold text-sm hover:bg-surface-100 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
