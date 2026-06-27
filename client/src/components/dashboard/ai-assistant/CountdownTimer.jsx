import { useEffect, useState } from "react";

function formatRemaining(ms) {
  if (ms <= 0) return "due now";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function CountdownTimer({ targetDate }) {
  const [remaining, setRemaining] = useState(() => new Date(targetDate).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(new Date(targetDate).getTime() - Date.now());
    }, 30000);
    return () => clearInterval(id);
  }, [targetDate]);

  return <span>{formatRemaining(remaining)}</span>;
}
