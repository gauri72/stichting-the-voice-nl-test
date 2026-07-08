import { useEffect, useState } from "react";
import { fetchEventShorts } from "../shared/eventExperienceApi.js";

export default function useEventShorts() {
  const [rows, setRows] = useState({ featured: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchEventShorts()
      .then((data) => {
        if (!cancelled) setRows({ featured: data?.featured || [], upcoming: data?.upcoming || [] });
      })
      .catch(() => {
        if (!cancelled) setRows({ featured: [], upcoming: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...rows, loading, hasAny: rows.featured.length > 0 || rows.upcoming.length > 0 };
}
