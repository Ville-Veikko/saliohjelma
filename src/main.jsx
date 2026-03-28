import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('App error boundary:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: '#f87171', fontSize: 14, maxWidth: 430, margin: '0 auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Tapahtui virhe</div>
          <div style={{ color: '#888', marginBottom: 24 }}>{this.state.error.message}</div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ background: '#2a2a2a', border: 'none', color: '#ccc', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}
          >
            Yritä uudelleen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
