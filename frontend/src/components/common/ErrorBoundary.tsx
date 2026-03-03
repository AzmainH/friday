import { Component, type ErrorInfo, type ReactNode } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

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
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{ fontSize: '4rem', fontWeight: 800, opacity: 0.15, mb: 2 }}
          >
            Oops
          </Typography>
          <Typography variant="h5" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Typography>
          {this.state.requestId && (
            <Typography variant="caption" color="text.disabled" sx={{ mb: 3, display: 'block' }}>
              Request ID: {this.state.requestId}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button variant="contained" onClick={() => (window.location.href = '/')}>
              Go Home
            </Button>
            <Button variant="outlined" onClick={this.handleReset}>
              Try Again
            </Button>
          </Box>
        </Container>
      )
    }

    return this.props.children
  }
}
