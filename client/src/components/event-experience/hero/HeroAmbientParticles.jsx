import { useMemo } from "react";

function seededParticles(count) {
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 137.5) % 360;
    return {
      id: i,
      left: `${(seed * 3.7) % 100}%`,
      size: 2 + ((i * 7) % 4),
      duration: 14 + ((i * 5) % 10),
      delay: -(i * 1.3),
      drift: (i % 2 === 0 ? 1 : -1) * (20 + (i % 3) * 10),
    };
  });
}

/**
 * Subtle floating-particle ambience behind the hero — non-interactive,
 * decorative only, and fully removed under prefers-reduced-motion.
 */
export default function HeroAmbientParticles() {
  const particles = useMemo(() => seededParticles(18), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 block rounded-full bg-white/30"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `evx-particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            "--evx-drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
