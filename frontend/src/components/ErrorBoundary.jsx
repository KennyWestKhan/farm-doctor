import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32,
        background: 'var(--bg)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Something went wrong</h2>
        <p className="muted" style={{ maxWidth: 320, marginBottom: 20 }}>
          The app hit an unexpected error. Reloading usually fixes it.
        </p>
        <button className="btn" onClick={() => window.location.reload()}>
          Reload
        </button>
        <button
          className="btn btn--ghost"
          style={{ marginTop: 12 }}
          onClick={() => { window.location.href = '/'; }}
        >
          Go Home
        </button>
      </div>
    );
  }
}
