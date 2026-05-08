import { Component, type ErrorInfo, type ReactNode } from 'react'

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info)
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="min-h-screen bg-stone-50 p-6 text-stone-950">
        <section className="mx-auto max-w-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Something needs attention</h1>
          <p className="mt-3 text-stone-700">
            The local workspace hit an unexpected error. Reloading the page usually restores the
            last saved draft from IndexedDB.
          </p>
          <pre className="mt-4 overflow-auto bg-rose-50 p-3 text-sm text-rose-950">
            {this.state.error.message}
          </pre>
          <button
            className="mt-5 border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </section>
      </main>
    )
  }
}
