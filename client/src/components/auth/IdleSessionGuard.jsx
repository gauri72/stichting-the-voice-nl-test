import { useIdleLogout } from "../../hooks/useIdleLogout.js";

export default function IdleSessionGuard({ enabled, onIdle, children }) {
  useIdleLogout({ enabled, onIdle });
  return children;
}
