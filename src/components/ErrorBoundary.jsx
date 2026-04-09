import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ React Error Boundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-zinc-800 mb-2">
              Terjadi Kesalahan
            </h1>
            <p className="text-zinc-500 text-sm mb-6">
              Aplikasi mengalami error yang tidak terduga. Silakan coba muat ulang halaman.
            </p>
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <pre className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
