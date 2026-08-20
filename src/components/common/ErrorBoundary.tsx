import { Component, type ReactNode } from 'react'
import { ErrorState } from './ErrorState'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Catches render errors so one broken view never blanks the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Render error caught by ErrorBoundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-card m-6">
          <ErrorState
            title="Something went wrong"
            description="This view hit an unexpected error. Please try again."
            onRetry={() => this.setState({ hasError: false })}
          />
        </div>
      )
    }
    return this.props.children
  }
}
