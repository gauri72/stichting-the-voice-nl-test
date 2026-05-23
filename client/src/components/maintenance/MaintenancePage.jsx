import { useEffect, useState } from "react";
import "../../styles/maintenance.css";

const LOGO_SRC = `${import.meta.env.BASE_URL}favicon.png`;

// 24 May 2026, 12:12 PM CEST (UTC+2)
const TARGET_DATE = new Date("2026-05-24T10:12:00.000Z");

function pad(n) {
  return String(n).padStart(2, "0");
}

function getTimeLeft() {
  const diff = TARGET_DATE - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, done: false };
}

function CountdownUnit({ value, label }) {
  return (
    <div className="maint-countdown__unit">
      <span className="maint-countdown__value">{pad(value)}</span>
      <span className="maint-countdown__label">{label}</span>
    </div>
  );
}

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    if (timeLeft.done) return undefined;
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [timeLeft.done]);

  return (
    <div className="maint-page">
      <div className="maint-page__bg" aria-hidden />

      <div className="maint-page__card">
        <div className="maint-page__logo-wrap" aria-hidden>
          <img src={LOGO_SRC} alt="" width={64} height={64} />
        </div>

        <p className="maint-page__org">Stichting The V.O.I.C.E. NL</p>

        <h1 className="maint-page__heading">We'll be right back</h1>

        <p className="maint-page__body">
          Our website is currently down for scheduled maintenance. We're working hard to
          bring you an even better experience. We'll be back online on{" "}
          <strong>24 May 2026 at 12:12 PM CEST</strong>.
        </p>

        {timeLeft.done ? (
          <p className="maint-page__live-soon">We're live — please refresh the page!</p>
        ) : (
          <div className="maint-countdown" aria-label="Time until site is back">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <span className="maint-countdown__sep" aria-hidden>:</span>
            <CountdownUnit value={timeLeft.hours} label="Hours" />
            <span className="maint-countdown__sep" aria-hidden>:</span>
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            <span className="maint-countdown__sep" aria-hidden>:</span>
            <CountdownUnit value={timeLeft.seconds} label="Seconds" />
          </div>
        )}

        <p className="maint-page__contact">
          Questions?{" "}
          <a href="mailto:info@thevoicenl.org">info@thevoicenl.org</a>
        </p>
      </div>
    </div>
  );
}
