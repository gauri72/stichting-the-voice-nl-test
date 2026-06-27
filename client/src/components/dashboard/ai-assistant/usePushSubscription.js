import { useCallback, useState } from "react";
import { apiFetch, authHeaders } from "../../../utils/api.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Requests Notification permission, subscribes via the service worker's PushManager, and registers the subscription with the backend. */
export function usePushSubscription() {
  const [status, setStatus] = useState("idle"); // idle | requesting | granted | denied | unsupported
  const [error, setError] = useState("");

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return false;
    }
    setStatus("requesting");
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return false;
      }

      const { vapidPublicKey } = await apiFetch("/api/ai/status", { headers: authHeaders() });
      if (!vapidPublicKey) {
        setError("Push notifications are not configured yet.");
        setStatus("denied");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await apiFetch("/api/ai/push/subscribe", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      setStatus("granted");
      return true;
    } catch (err) {
      setError(err.message || "Could not enable push notifications.");
      setStatus("denied");
      return false;
    }
  }, []);

  return { status, error, subscribe };
}
