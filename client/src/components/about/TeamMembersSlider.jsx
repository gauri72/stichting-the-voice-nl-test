import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconArrowRight, IconBrandLinkedin } from "@tabler/icons-react";
import { apiFetch } from "../../utils/api.js";
import { useAutoAdvance } from "../../hooks/useAutoAdvance.js";
import { getFallbackTeamMembers, getInitials, resolveTeamMemberImage } from "../../data/teamMembers.js";
import TeamMemberModal from "./TeamMemberModal.jsx";
import "../../styles/team-members-slider.css";

const AUTO_SCROLL_MS = 9000;
const SCROLL_STEP = 300;

function TeamCardPhoto({ member }) {
  const src = resolveTeamMemberImage(member);
  const name = member.fullName || member.name || "";
  const initials = member.initials || getInitials(name);

  if (src) {
    return <img className="tms-slider__photo" src={src} alt={name} loading="lazy" />;
  }

  return (
    <div className="tms-slider__photo tms-slider__photo--initials" aria-hidden>
      {initials}
    </div>
  );
}

export default function TeamMembersSlider({ sectionClassName = "", title = "", subtitle = "" }) {
  const { t } = useTranslation(["about"]);
  const resolvedTitle = title || t("about:team.title");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeDot, setActiveDot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch("/api/public/team-members")
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data.members) ? data.members : [];
        setMembers(items.length ? items : getFallbackTeamMembers());
      })
      .catch(() => {
        if (active) setMembers(getFallbackTeamMembers());
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const scrollBy = useCallback((delta) => {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const scrollNext = useCallback(() => scrollBy(SCROLL_STEP), [scrollBy]);
  const scrollPrev = useCallback(() => scrollBy(-SCROLL_STEP), [scrollBy]);

  useAutoAdvance(scrollNext, { enabled: members.length > 1 && !isPaused, intervalMs: AUTO_SCROLL_MS });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    function onScroll() {
      const cardWidth = track.firstElementChild?.getBoundingClientRect().width || SCROLL_STEP;
      const index = Math.round(track.scrollLeft / (cardWidth + 14));
      setActiveDot(Math.max(0, Math.min(index, members.length - 1)));
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [members.length]);

  return (
    <section
      id="about-us-team"
      className={`tms-slider${sectionClassName ? ` ${sectionClassName}` : ""}`}
      aria-labelledby="tms-slider-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="tms-slider__inner">
        <header className="tms-slider__header">
          <div className="tms-slider__heading">
            <span className="tms-slider__heading-line" aria-hidden="true" />
            <h2 id="tms-slider-title" className="tms-slider__title">
              {resolvedTitle}
            </h2>
            <span className="tms-slider__heading-line" aria-hidden="true" />
          </div>
          {subtitle ? (
            <p className="tms-slider__subtitle">{subtitle}</p>
          ) : (
            <p className="tms-slider__subtitle">
              {t("about:team.subtitle")}
            </p>
          )}
        </header>

        {loading ? (
          <p className="tms-slider__status" role="status">{t("about:team.loading")}</p>
        ) : null}

        {!loading && members.length > 0 ? (
          <div className="tms-slider__carousel" aria-roledescription="carousel" aria-label="Team members">
            <button
              type="button"
              className="tms-slider__nav tms-slider__nav--prev"
              onClick={scrollPrev}
              aria-label="Scroll to previous team members"
            >
              <IconArrowLeft size={20} stroke={2} aria-hidden />
            </button>

            <div className="tms-slider__track-wrap">
              <div className="tms-slider__track" ref={trackRef} role="list">
                {members.map((member, index) => {
                  const name = member.fullName || member.name || "";
                  const role = member.role || "";
                  const designation = member.designation || member.teamCategory || "";
                  return (
                    <article
                      key={member.id || `${name}-${index}`}
                      className={`tms-slider__card${member.featured ? " tms-slider__card--featured" : ""}`}
                      role="listitem"
                      tabIndex={0}
                      onClick={(e) => {
                        if (e.target.closest("a, button")) return;
                        setActiveIndex(index);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveIndex(index);
                        }
                      }}
                    >
                      <div className="tms-slider__card-glow" aria-hidden />
                      <div className="tms-slider__avatar-wrap">
                        <div className="team-avatar tms-slider__avatar">
                          <TeamCardPhoto member={member} />
                        </div>
                        {member.isBoardMember ? (
                          <span className="tms-slider__badge tms-slider__badge--board">{t("about:team.board")}</span>
                        ) : null}
                        {designation ? (
                          <span className="tms-slider__badge">{designation}</span>
                        ) : null}
                      </div>
                      <div className="tms-slider__card-body">
                        <h3 className="tms-slider__card-name">{name}</h3>
                        <p className="tms-slider__card-role">{role}</p>
                        <div className="tms-slider__card-actions">
                          {member.linkedinUrl ? (
                            <a
                              href={member.linkedinUrl}
                              className="tms-slider__linkedin"
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${name} on LinkedIn`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconBrandLinkedin size={18} stroke={1.75} aria-hidden />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            className="tms-slider__view-btn"
                            onClick={() => setActiveIndex(index)}
                          >
                            {t("about:team.viewProfile")}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="tms-slider__nav tms-slider__nav--next"
              onClick={scrollNext}
              aria-label="Scroll to next team members"
            >
              <IconArrowRight size={20} stroke={2} aria-hidden />
            </button>

            {members.length > 1 ? (
              <div className="tms-slider__dots" role="tablist" aria-label="Team member slides">
                {members.map((member, index) => (
                  <button
                    key={member.id || index}
                    type="button"
                    role="tab"
                    className={`tms-slider__dot${index === activeDot ? " tms-slider__dot--active" : ""}`}
                    aria-selected={index === activeDot}
                    aria-label={`Go to ${member.fullName || member.name}`}
                    onClick={() => {
                      const track = trackRef.current;
                      const card = track?.children[index];
                      card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <TeamMemberModal
        members={members}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(-1)}
        onPrev={() => setActiveIndex((idx) => (idx <= 0 ? members.length - 1 : idx - 1))}
        onNext={() => setActiveIndex((idx) => (idx >= members.length - 1 ? 0 : idx + 1))}
      />
    </section>
  );
}
