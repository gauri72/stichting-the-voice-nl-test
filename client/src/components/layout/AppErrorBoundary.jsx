import { Component } from "react";
import { withTranslation } from "react-i18next";

function clearSplashLock() {
  document.documentElement.classList.remove("splash-open");
}

class AppErrorBoundary extends Component {
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
      const { t } = this.props;
      return (
        <div className="app-error-state">
          <div className="app-error-state__card">
            <h1>{t("common:errorBoundary.heading")}</h1>
            <p>
              {t("common:errorBoundary.message")}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              {t("common:errorBoundary.refreshButton")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation(["common"])(AppErrorBoundary);
