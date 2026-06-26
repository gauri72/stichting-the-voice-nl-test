import { useCallback, useRef, useState } from "react";

const AUTO_DISMISS_MS = 4000;

/**
 * Local, page-scoped toast stack — no Context, since toasts are page-level UI feedback for
 * a single admin session, not cross-page state. Instantiate once per page and pass
 * `pushToast` down to whichever child components need to report save/delete/copy results.
 */
export default function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(({ type = "success", message }) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
  }, [dismissToast]);

  return { toasts, pushToast, dismissToast };
}
