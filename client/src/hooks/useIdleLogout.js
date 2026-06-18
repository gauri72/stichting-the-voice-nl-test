import { useEffect, useRef } from "react";

export const SESSION_IDLE_TIMEOUT_MS = 10 * 60 * 1000;

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "click"];

export function useIdleLogout({ enabled = false, onIdle, timeoutMs = SESSION_IDLE_TIMEOUT_MS }) {
  const onIdleRef = useRef(onIdle);
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) return undefined;

    const clearIdleTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const triggerIdle = () => {
      clearIdleTimer();
      onIdleRef.current?.();
    };

    const scheduleIdle = () => {
      clearIdleTimer();
      timeoutRef.current = window.setTimeout(triggerIdle, timeoutMs);
    };

    const markActive = () => {
      lastActivityRef.current = Date.now();
      scheduleIdle();
    };

    const handleVisibility = () => {
      if (document.hidden) return;
      if (Date.now() - lastActivityRef.current >= timeoutMs) {
        triggerIdle();
        return;
      }
      scheduleIdle();
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      document.addEventListener(eventName, markActive, { passive: true });
    });
    window.addEventListener("focus", markActive);
    document.addEventListener("visibilitychange", handleVisibility);

    markActive();

    return () => {
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach((eventName) => {
        document.removeEventListener(eventName, markActive);
      });
      window.removeEventListener("focus", markActive);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, timeoutMs]);
}
