import { Component } from "react";

function clearSplashLock() {
  document.documentElement.classList.remove("splash-open");
}

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    clearSplashLock();
    console.error("App render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error-state">
          <div className="app-error-state__card">
            <h1>Something went wrong</h1>
            <p>
              The page could not load. Please refresh or try again later.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
