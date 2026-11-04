import React from 'react';

// Error Boundary to catch render errors and prevent blank screens
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b0f19',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#151d30',
            border: '1px solid #1e293d',
            borderRadius: '12px',
            padding: '32px'
          }}>
            <h2 style={{ fontSize: '22px', marginBottom: '12px', color: '#f43f5e' }}>
              Application Render Notice
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected state occurred while displaying the page.'}
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem('book_user');
                  sessionStorage.removeItem('book_token');
                } catch (e) { }
                window.location.reload();
              }}
              style={{
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reset Session & Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

