import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#a78bfa", "#22d3ee", "#fbbf24", "#34d399", "#f472b6"];

// A lightweight celebratory burst for bonus points / milestones — no extra
// dependency, just a handful of CSS-animated particles fired from one point.
export default function ConfettiBurst({ active }) {
  const reduceMotion = useReducedMotion();
  if (!active || reduceMotion) return null;

  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    angle: (i / 18) * Math.PI * 2,
    color: COLORS[i % COLORS.length],
    distance: 60 + Math.random() * 60,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute h-2 w-2 rounded-sm"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 0.4,
            rotate: 180,
          }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
