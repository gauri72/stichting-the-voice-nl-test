import { useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

export function isGoogleSignInEnabled() {
  return Boolean(GOOGLE_CLIENT_ID);
}

function GoogleIcon() {
  return (
    <svg className="login-form-section__google-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({ onSuccess, onError, disabled }) {
  const wrapRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    function syncOverlayWidth() {
      const overlay = wrap.querySelector(".login-form-section__google-overlay");
      const width = Math.max(wrap.offsetWidth, 280);
      if (overlay) {
        overlay.style.width = `${width}px`;
        overlay.style.height = "50px";
      }
    }

    syncOverlayWidth();
    window.addEventListener("resize", syncOverlayWidth);
    return () => window.removeEventListener("resize", syncOverlayWidth);
  }, []);

  if (!isGoogleSignInEnabled()) {
    return null;
  }

  return (
    <div
      ref={wrapRef}
      className={`login-form-section__google-wrap${disabled ? " login-form-section__google-wrap--disabled" : ""}`}
    >
      <button type="button" className="login-form-section__google-btn" tabIndex={-1} aria-hidden="true">
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>
      <div className="login-form-section__google-overlay" aria-label="Continue with Google">
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              onSuccessRef.current(response.credential);
            } else {
              onErrorRef.current?.("Google sign-in failed. Please try again.");
            }
          }}
          onError={() => onErrorRef.current?.("Google sign-in was cancelled or failed.")}
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          width="400"
          useOneTap={false}
        />
      </div>
    </div>
  );
}
