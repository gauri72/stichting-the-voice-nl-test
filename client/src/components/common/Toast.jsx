import { createPortal } from "react-dom";
import { IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react";
import "../../styles/toast.css";

const ICONS = {
  success: IconCheck,
  error: IconAlertTriangle,
};

/** Fixed bottom-right stack, rendered via portal so it's never clipped by an ancestor's
 * overflow/transform — same portal approach already used by LoginModal.jsx. */
export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return createPortal(
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || IconCheck;
        return (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <Icon size={18} aria-hidden />
            <span className="toast__message">{toast.message}</span>
            <button type="button" className="toast__close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
              <IconX size={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
