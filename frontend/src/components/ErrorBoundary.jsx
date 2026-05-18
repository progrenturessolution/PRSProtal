import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <h3>Something went wrong while loading this student record.</h3>
          <p style={{ color: '#6b7280' }}>
            Try returning to the previous view or reopen the student details.
          </p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="premium-btn">Try again</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
