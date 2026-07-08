import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import {
  fetchSavedEventIds,
  saveEventRequest,
  unsaveEventRequest,
  bulkSaveEventsRequest,
} from "./eventExperienceApi.js";

const STORAGE_KEY = "evx_saved_event_ids";

function readLocalIds() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeLocalIds(set) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Storage unavailable (private mode, quota) — saves just won't persist.
  }
}

// Guests save to localStorage only. On login, any locally-saved ids are
// merged into the server-side SavedEvent collection once, then local
// storage is cleared so the server becomes the single source of truth.
export default function useSavedEvents() {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState(() => readLocalIds());
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setSynced(false);
      return;
    }
    if (synced) return;

    const localIds = Array.from(readLocalIds());
    fetchSavedEventIds()
      .then(async (data) => {
        const serverIds = new Set(data.eventIds || []);
        const toSync = localIds.filter((id) => !serverIds.has(id));
        if (toSync.length) {
          await bulkSaveEventsRequest(toSync);
          toSync.forEach((id) => serverIds.add(id));
        }
        setSavedIds(serverIds);
        window.localStorage.removeItem(STORAGE_KEY);
      })
      .catch(() => {})
      .finally(() => setSynced(true));
  }, [isAuthenticated, synced]);

  const toggleSaved = useCallback(
    (eventId) => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        const willSave = !next.has(eventId);
        if (willSave) next.add(eventId);
        else next.delete(eventId);

        if (isAuthenticated) {
          const request = willSave ? saveEventRequest(eventId) : unsaveEventRequest(eventId);
          request.catch(() => {});
        } else {
          writeLocalIds(next);
        }
        return next;
      });
    },
    [isAuthenticated]
  );

  const isSaved = useCallback((eventId) => savedIds.has(eventId), [savedIds]);

  return { savedIds, isSaved, toggleSaved };
}
