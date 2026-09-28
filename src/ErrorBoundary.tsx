import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary atrapó un error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6 bg-bg">
          <p className="text-ink-dark font-semibold">Algo salió mal.</p>
          <p className="text-sm text-muted max-w-sm">{this.state.error.message}</p>
          <button
            className="h-11 px-5 rounded bg-ink text-bg font-semibold"
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
