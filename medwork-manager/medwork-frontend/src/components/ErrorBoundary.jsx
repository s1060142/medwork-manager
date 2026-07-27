import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: '#b00020' }}>
          <h2>Si è verificato un errore nell'interfaccia</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fff3f3', padding: 12, borderRadius: 8 }}>
            {this.state.error?.stack || String(this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px' }}>
            Ricarica pagina
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
