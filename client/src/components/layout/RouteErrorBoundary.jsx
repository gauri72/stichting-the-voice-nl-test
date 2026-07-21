import { Component } from "react";
import { withTranslation } from "react-i18next";

/**
 * Isolates render errors so one broken section does not crash the whole app.
 */
class RouteErrorBoundary extends Component {
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
      const { t } = this.props;
      return (
        <div className="route-error-boundary" role="alert">
          <h2>{this.props.title || t("common:routeErrorBoundary.heading")}</h2>
          <p>{this.props.message || t("common:routeErrorBoundary.message")}</p>
          <button type="button" className="admin-events__primary-btn" onClick={() => window.location.reload()}>
            {t("common:routeErrorBoundary.refreshButton")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default withTranslation(["common"])(RouteErrorBoundary);
