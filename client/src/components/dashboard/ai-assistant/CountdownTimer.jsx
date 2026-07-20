import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function formatRemaining(ms, t) {
  if (ms <= 0) return t("dashboardMain:aiAssistant.countdown.dueNow");
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return t("dashboardMain:aiAssistant.countdown.daysHours", { days, hours });
  if (hours > 0) return t("dashboardMain:aiAssistant.countdown.hoursMinutes", { hours, minutes });
  return t("dashboardMain:aiAssistant.countdown.minutes", { minutes });
}

export default function CountdownTimer({ targetDate }) {
  const { t } = useTranslation(["dashboardMain"]);
  const [remaining, setRemaining] = useState(() => new Date(targetDate).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(new Date(targetDate).getTime() - Date.now());
    }, 30000);
    return () => clearInterval(id);
  }, [targetDate]);

  return <span>{formatRemaining(remaining, t)}</span>;
}
