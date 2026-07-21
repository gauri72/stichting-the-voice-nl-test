import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconCalendarEvent, IconMapPin } from "@tabler/icons-react";
import EventCardMedia from "./EventCardMedia.jsx";
import { CategoryBadge, AvailabilityBadge, VideoBadge } from "./EventCardBadges.jsx";
import SaveEventButton from "./SaveEventButton.jsx";
import { ShareButton } from "./ShareSheet.jsx";
import EventCountdownBadge from "./EventCountdownBadge.jsx";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
};

function isSoldOut(event) {
  return event?.availabilityBadge === "Sold Out";
}

/**
 * Reusable event card. `variant` switches layout: featured | grid | video |
 * calendar | list. video/calendar variants are added in later phases of
 * this build (Event Shorts carousel / Events Calendar) — only featured and
 * grid are implemented so far.
 */
export default function EventCard({ event, variant = "grid", onWatchShort }) {
  if (!event) return null;

  if (variant === "featured") return <FeaturedCard event={event} onWatchShort={onWatchShort} />;
  return <GridCard event={event} onWatchShort={onWatchShort} />;
}

function FeaturedCard({ event, onWatchShort }) {
  const { t } = useTranslation(["eventExperience"]);
  const soldOut = isSoldOut(event);
  const image = event.featuredHeroImageUrl || event.heroImage;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="relative flex h-full w-full items-center overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-0">
        <EventCardMedia src={image} alt={event.title} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
      </div>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
        <SaveEventButton eventId={event.id} />
        <ShareButton event={event} />
      </div>

      <div className="relative z-10 flex flex-col gap-4 px-6 py-10 sm:px-12 sm:py-16 max-w-2xl">
        <motion.div variants={fadeUpItem} className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={event.category} />
          {event.availabilityBadge ? <AvailabilityBadge status={event.availabilityBadge} /> : null}
          <EventCountdownBadge date={event.date} startTime={event.startTime} />
        </motion.div>

        <motion.h2 variants={fadeUpItem} className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          {event.featuredTitle || event.title}
        </motion.h2>

        {event.featuredSubtitle || event.featuredDescription ? (
          <motion.p variants={fadeUpItem} className="max-w-xl text-sm text-white/85 sm:text-base">
            {event.featuredSubtitle || event.featuredDescription}
          </motion.p>
        ) : null}

        <motion.div variants={fadeUpItem} className="flex flex-wrap items-center gap-4 text-sm text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <IconCalendarEvent size={16} /> {event.dateLabel}
            {event.startTime ? ` · ${event.startTime}` : ""}
          </span>
          {event.venueName ? (
            <span className="inline-flex items-center gap-1.5">
              <IconMapPin size={16} /> {event.venueName}
            </span>
          ) : null}
          {event.priceFromFormatted ? (
            <span className="font-semibold text-white">
              {event.isFree
                ? t("eventExperience:card.free")
                : t("eventExperience:card.priceFrom", { price: event.priceFromFormatted })}
            </span>
          ) : null}
        </motion.div>

        <motion.div variants={fadeUpItem} className="mt-2 flex flex-wrap items-center gap-3">
          {!soldOut ? (
            <Link
              to={`/events/${event.slug || event.id}/tickets`}
              className="relative isolate inline-flex items-center justify-center overflow-hidden rounded-full bg-evx-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-evx-accent/30 transition hover:brightness-110 active:scale-95"
            >
              {event.featuredCtaText || t("eventExperience:card.getTickets")}
            </Link>
          ) : (
            <Link
              to={`/events/${event.slug || event.id}/tickets`}
              className="inline-flex items-center justify-center rounded-full bg-white/15 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/25 active:scale-95"
            >
              {t("eventExperience:card.joinWaitlist")}
            </Link>
          )}
          <Link
            to={`/events/${event.slug || event.id}/tickets`}
            className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
          >
            {t("eventExperience:card.learnMore")}
          </Link>
          {event.hasVideo ? (
            <button
              type="button"
              onClick={() => onWatchShort?.(event)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
            >
              ▶ {t("eventExperience:card.watchShort")}
            </button>
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  );
}

function GridCard({ event, onWatchShort }) {
  const { t } = useTranslation(["eventExperience"]);
  const soldOut = isSoldOut(event);

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-evx-border bg-evx-card-bg shadow-[0_2px_12px_var(--color-evx-shadow)] dark:border-evx-border/60 dark:bg-evx-surface-elevated/60 dark:backdrop-blur-md dark:shadow-none ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <EventCardMedia
          src={event.heroImage}
          alt={event.title}
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3">
          <CategoryBadge category={event.category} />
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <SaveEventButton eventId={event.id} />
          <ShareButton event={event} />
          {event.hasVideo ? <VideoBadge onClick={() => onWatchShort?.(event)} /> : null}
        </div>
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          {event.availabilityBadge ? <AvailabilityBadge status={event.availabilityBadge} /> : null}
          <EventCountdownBadge date={event.date} startTime={event.startTime} />
        </div>

        {/* Hover quick-actions overlay (desktop) */}
        <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/0 p-3 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
          {!soldOut ? (
            <Link
              to={`/events/${event.slug || event.id}/tickets`}
              className="translate-y-2 rounded-full bg-evx-accent px-4 py-2 text-xs font-bold text-white shadow transition group-hover:translate-y-0"
            >
              {t("eventExperience:card.getTickets")}
            </Link>
          ) : (
            <Link
              to={`/events/${event.slug || event.id}/tickets`}
              className="translate-y-2 rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-white/30 group-hover:translate-y-0"
            >
              {t("eventExperience:card.joinWaitlist")}
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-evx-heading">{event.title}</h3>
        <p className="flex items-center gap-1.5 text-xs text-evx-text-muted">
          <IconCalendarEvent size={14} /> {event.dateLabel}
          {event.startTime ? ` · ${event.startTime}` : ""}
        </p>
        {event.venueName ? (
          <p className="flex items-center gap-1.5 text-xs text-evx-text-muted">
            <IconMapPin size={14} /> {event.venueName}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-bold text-evx-accent">
            {event.isFree
              ? t("eventExperience:card.free")
              : event.priceFromFormatted
                ? t("eventExperience:card.priceFrom", { price: event.priceFromFormatted })
                : ""}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
