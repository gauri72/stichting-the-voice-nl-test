import { useState } from "react";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

/* ── Skeleton block ── */
export function SkeletonBlock({ style, className = "" }) {
  return <div className={`mkt-skeleton ${className}`} style={style} aria-hidden="true" />;
}

/* ── Image with graceful fallback ── */
export function ImageWithFallback({ src, alt = "", className = "", style }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div
        className={className}
        style={{
          background: "linear-gradient(140deg,var(--mkt-surface-subtle) 0%,var(--mkt-surface-elevated) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--mkt-border-strong)",
          fontSize: "1.5rem",
          ...style,
        }}
        aria-hidden="true"
      >
        ▪
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setErrored(true)}
      loading="lazy"
    />
  );
}

/* ── Badge ── */
export function Badge({ children, color = "purple" }) {
  const colorMap = {
    purple: { bg: "var(--mkt-purple-dim)", color: "var(--mkt-purple)", border: "rgba(139,92,246,0.25)" },
    cyan:   { bg: "var(--mkt-cyan-dim)",   color: "var(--mkt-cyan)",   border: "rgba(0,212,255,0.25)"  },
    green:  { bg: "var(--mkt-green-dim)",  color: "var(--mkt-green)",  border: "rgba(0,255,178,0.22)"  },
    gold:   { bg: "var(--mkt-gold-dim)",   color: "var(--mkt-gold)",   border: "rgba(248,184,78,0.25)" },
  };
  const c = colorMap[color] || colorMap.purple;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "0.58rem",
        fontWeight: 800,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        padding: "2px 9px",
        borderRadius: 20,
        lineHeight: 1.8,
      }}
    >
      {children}
    </span>
  );
}

/* ── Favourite button ── */
export function FavouriteButton({ active, onToggle, size = 14, "aria-label": label = "Toggle favourite" }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onToggle(); }}
      aria-label={label}
      aria-pressed={active}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        color: active ? "var(--mkt-pink)" : "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {active ? <IconHeartFilled size={size} /> : <IconHeart size={size} />}
    </button>
  );
}

/* ── Star rating ── */
export function StarRating({ rating }) {
  const full = Math.round(rating ?? 0);
  return (
    <span style={{ color: "var(--mkt-gold)", letterSpacing: 1 }} aria-label={`${rating ?? 0} out of 5`}>
      {"★".repeat(full)}{"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

/* ── Section header ── */
export function SectionHeader({ title, linkLabel, linkHref }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <h2 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--mkt-text)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
        {title}
      </h2>
      {linkHref && (
        <a href={linkHref} style={{ fontSize: "0.73rem", color: "var(--mkt-cyan)", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
          {linkLabel || "View All"} ›
        </a>
      )}
    </div>
  );
}
