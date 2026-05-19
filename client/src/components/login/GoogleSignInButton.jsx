import { useRef } from "react";
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
  const nativeRef = useRef(null);

  if (!isGoogleSignInEnabled()) {
    return null;
  }

  function triggerNativeGoogleSignIn() {
    if (disabled) return;
    const nativeButton = nativeRef.current?.querySelector('[role="button"]');
    nativeButton?.click();
  }

  return (
    <div className="login-form-section__google-wrap">
      <button
        type="button"
        className="login-form-section__google-btn"
        disabled={disabled}
        onClick={triggerNativeGoogleSignIn}
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>
      <div
        ref={nativeRef}
        className="login-form-section__google-native"
        aria-hidden="true"
        tabIndex={-1}
      >
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              onError?.("Google sign-in failed. Please try again.");
            }
          }}
          onError={() => onError?.("Google sign-in was cancelled or failed.")}
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          width="200"
          useOneTap={false}
        />
      </div>
    </div>
  );
}
