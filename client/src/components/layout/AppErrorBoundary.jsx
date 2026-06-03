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
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "system-ui, sans-serif",
            background: "#0c1520",
            color: "#e4edf5",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 12px", fontSize: "1.5rem" }}>Something went wrong</h1>
            <p style={{ margin: "0 0 20px", opacity: 0.85 }}>
              The page could not load. Please refresh or try again later.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#118a93",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
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
