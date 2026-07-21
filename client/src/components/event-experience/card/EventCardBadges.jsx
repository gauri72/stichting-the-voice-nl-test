import { useTranslation } from "react-i18next";
import { IconPlayerPlayFilled } from "@tabler/icons-react";

const AVAILABILITY_STYLES = {
  "Selling Fast": "bg-red-500/90 text-white animate-pulse",
  "Few Tickets Left": "bg-amber-500/90 text-white",
  Free: "bg-evx-accent text-white",
  "Sold Out": "bg-evx-text-muted/80 text-white",
};

export function CategoryBadge({ category, className = "" }) {
  if (!category) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm ${className}`}
    >
      {category}
    </span>
  );
}

export function AvailabilityBadge({ status, className = "" }) {
  if (!status) return null;
  const style = AVAILABILITY_STYLES[status] || "bg-evx-accent text-white";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${style} ${className}`}
    >
      {status}
    </span>
  );
}

export function VideoBadge({ onClick, className = "", size = "sm" }) {
  const { t } = useTranslation(["eventExperience"]);
  const dims = size === "lg" ? "h-12 w-12" : "h-7 w-7";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("eventExperience:card.videoBadge.ariaLabel")}
      className={`inline-flex ${dims} items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm transition hover:scale-110 hover:bg-evx-accent ${className}`}
    >
      <IconPlayerPlayFilled size={size === "lg" ? 22 : 14} />
    </button>
  );
}
