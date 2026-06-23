import { Component } from "react";

/**
 * Isolates render errors so one broken section does not crash the whole app.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[error-boundary:${this.props.name || "route"}]`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="route-error-boundary" role="alert">
          <h2>{this.props.title || "Something went wrong"}</h2>
          <p>{this.props.message || "This section could not load. Please refresh or try again."}</p>
          <button type="button" className="admin-events__primary-btn" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
