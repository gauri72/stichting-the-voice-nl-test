import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "vco_favourites";

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeStore(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore QuotaExceededError */
  }
}

/**
 * localStorage-backed favourites hook.
 * Stores small snapshots (not bare ids) so the /vcommerce/favourites page
 * can render without a "fetch by id" round-trip.
 *
 * NOTE: favourites are device/session-local until a real backend feature
 * is prioritised by the product team.
 */
export function useFavourites() {
  const [favourites, setFavourites] = useState(readStore);

  useEffect(() => {
    writeStore(favourites);
  }, [favourites]);

  const isFavourite = useCallback(
    (id) => favourites.some((f) => f.id === id),
    [favourites]
  );

  const toggleFavourite = useCallback((item) => {
    setFavourites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      return exists ? prev.filter((f) => f.id !== item.id) : [...prev, item];
    });
  }, []);

  const clearFavourites = useCallback(() => setFavourites([]), []);

  return { favourites, isFavourite, toggleFavourite, clearFavourites };
}
