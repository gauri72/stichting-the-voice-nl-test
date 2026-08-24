import "../../styles/amsterdam-flames-fx.css";

// Fixed, hand-tuned positions/timings rather than random on every render —
// keeps the effect identical across renders and avoids embers clustering.
const EMBERS = [
  { left: "12%", duration: "9s", delay: "0s", drift: "10px", size: 4 },
  { left: "22%", duration: "11s", delay: "1.5s", drift: "-14px", size: 3 },
  { left: "35%", duration: "8s", delay: "3s", drift: "6px", size: 5 },
  { left: "48%", duration: "12s", delay: "0.5s", drift: "-8px", size: 3 },
  { left: "58%", duration: "10s", delay: "4s", drift: "12px", size: 4 },
  { left: "68%", duration: "9.5s", delay: "2s", drift: "-10px", size: 3 },
  { left: "78%", duration: "11.5s", delay: "5s", drift: "8px", size: 5 },
  { left: "88%", duration: "8.5s", delay: "1s", drift: "-6px", size: 3 },
];

export default function AmsterdamFlamesEmbers() {
  return (
    <div className="af-flames-fx" aria-hidden="true">
      <span className="af-flames-fx__glow" />
      {EMBERS.map((ember, i) => (
        <span
          key={i}
          className="af-ember"
          style={{
            left: ember.left,
            width: ember.size,
            height: ember.size,
            animationDuration: ember.duration,
            animationDelay: ember.delay,
            "--af-drift": ember.drift,
          }}
        />
      ))}
    </div>
  );
}
