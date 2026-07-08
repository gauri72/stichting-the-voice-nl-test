import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCalendarMonth } from "../shared/eventExperienceApi.js";

export default function useCalendarMonth(year, month) {
  const cacheRef = useRef(new Map());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((y, m) => {
    const key = `${y}-${m}`;
    if (cacheRef.current.has(key)) {
      setData(cacheRef.current.get(key));
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCalendarMonth(y, m)
      .then((result) => {
        cacheRef.current.set(key, result);
        setData(result);
      })
      .catch(() => setData({ year: y, month: m, days: {} }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(year, month);
  }, [year, month, load]);

  return { data, loading };
}
