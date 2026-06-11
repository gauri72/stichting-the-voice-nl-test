const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
}

export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const response = await fetch(apiUrl(path), {
    ...options,
    headers
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else if (!response.ok) {
    const text = await response.text().catch(() => "");
    // Discard HTML proxy error pages — only use plain-text bodies as the message.
    if (text && !text.trimStart().startsWith("<")) data = { error: text.slice(0, 200) };
  }

  if (!response.ok) {
    const networkHint =
      !data && (response.status === 502 || response.status === 504)
        ? "Cannot reach the API. Check that the server is running and restart the dev app."
        : null;
    const fallback =
      response.status === 413
        ? "The file is too large to upload. Try reducing the template size."
        : response.status === 503
        ? "The server could not send email right now. Please try again later."
        : response.status >= 500
          ? "Server error. Please try again later."
          : "Request failed.";
    const error = new Error(networkHint || data?.error || data?.message || fallback);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const AUTH_TOKEN_KEY = "voice_auth_token";
export const ADMIN_AUTH_TOKEN_KEY = "voice_admin_token";
export const ADMIN_REMEMBER_ME_KEY = "voice_admin_remember_me";
export const ADMIN_REMEMBER_EMAIL_KEY = "voice_admin_remember_email";
export const REMEMBER_ME_KEY = "voice_remember_me";
export const REMEMBER_EMAIL_KEY = "voice_remember_email";

export function getStoredToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token, rememberMe = true) {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);

  if (!token) return;

  if (rememberMe) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getRememberedEmail() {
  if (localStorage.getItem(REMEMBER_ME_KEY) !== "true") return "";
  return localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
}

export function setRememberedEmail(email, rememberMe) {
  if (rememberMe && email) {
    localStorage.setItem(REMEMBER_ME_KEY, "true");
    localStorage.setItem(REMEMBER_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
  }
}

export function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getStoredAdminToken() {
  return (
    sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY) || localStorage.getItem(ADMIN_AUTH_TOKEN_KEY)
  );
}

export function setStoredAdminToken(token, rememberMe = true) {
  localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);

  if (!token) return;

  if (rememberMe) {
    localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
  }
}

export function getRememberedAdminEmail() {
  if (localStorage.getItem(ADMIN_REMEMBER_ME_KEY) !== "true") return "";
  return localStorage.getItem(ADMIN_REMEMBER_EMAIL_KEY) || "";
}

export function setRememberedAdminEmail(email, rememberMe) {
  if (rememberMe && email) {
    localStorage.setItem(ADMIN_REMEMBER_ME_KEY, "true");
    localStorage.setItem(ADMIN_REMEMBER_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
    localStorage.removeItem(ADMIN_REMEMBER_EMAIL_KEY);
  }
}

export function adminAuthHeaders() {
  const token = getStoredAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
