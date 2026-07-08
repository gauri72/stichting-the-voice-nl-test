import { useEffect, useState } from "react";
import { fetchFeaturedEvents } from "../shared/eventExperienceApi.js";

export default function useFeaturedEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchFeaturedEvents({ limit: 8 })
      .then((data) => {
        if (!cancelled) setEvents(data?.events || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load featured events.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error };
}
