import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/voice-brand-reveal.css";

const BRAND_STEPS = ["V.", "V.O.", "V.O.I.", "V.O.I.C.", "V.O.I.C.E.", "V.O.I.C.E. NL"];

const DEFAULT_TAGLINE = "The Vision Of International Cultural Exchange In The Netherlands";

const DEFAULT_PILLAR_LINES = [
  "Connecting Cultures.",
  "Empowering Communities.",
  "Creating Experiences.",
  "Driving Innovation.",
];

const STEP_DELAY_S = 0.12;
const STEP_DURATION_S = 0.4;
const TAGLINE_PAUSE_S = 0.5;
const TAGLINE_DURATION_S = 0.8;
const PILLAR_STEP_S = 0.45;
const PILLAR_HOLD_S = 0.7;
const PILLAR_EXIT_S = 0.5;

/** Split progressive brand text — dots and " NL" use cyan accent. */
function renderBrandText(text) {
  const nodes = [];
  let index = 0;

  while (index < text.length) {
    if (text.slice(index, index + 3) === " NL") {
      nodes.push(
        <span key="nl" className="voice-brand-reveal__accent">
          {" NL"}
        </span>
      );
      break;
    }

    const char = text[index];
    if (char === ".") {
      nodes.push(
        <span key={`dot-${index}`} className="voice-brand-reveal__accent">
          .
        </span>
      );
    } else {
      nodes.push(<span key={`char-${index}`}>{char}</span>);
    }
    index += 1;
  }

  return nodes;
}

export function VoiceBrandReveal() {
  const { t } = useTranslation(["common"]);
  const overrides = useContentOverrides();
  const isCustomized = (value, fallback) => value && value !== fallback;
  const TAGLINE = isCustomized(overrides.siteBrandTagline, DEFAULT_TAGLINE)
    ? overrides.siteBrandTagline
    : t("common:brandReveal.tagline");
  const PILLAR_LINES = DEFAULT_PILLAR_LINES.map((line, i) => {
    const override = overrides[`sitePillarLine${i + 1}`];
    return isCustomized(override, line) ? override : t(`common:brandReveal.pillar${i + 1}`);
  });

  const [brandStep, setBrandStep] = useState(0);
  const [showTagline, setShowTagline] = useState(false);
  const [visiblePillars, setVisiblePillars] = useState(0);
  const [pillarsActive, setPillarsActive] = useState(false);
  const [pillarsVisible, setPillarsVisible] = useState(false);
  const [showFinalLine, setShowFinalLine] = useState(false);

  /* Phase 1 — progressive brand name reveal */
  useEffect(() => {
    if (brandStep >= BRAND_STEPS.length - 1) return undefined;

    const timer = window.setTimeout(() => {
      setBrandStep((prev) => prev + 1);
    }, STEP_DELAY_S * 1000);

    return () => window.clearTimeout(timer);
  }, [brandStep]);

  /* Phase 2 — tagline after final brand step animates + pause */
  useEffect(() => {
    if (brandStep < BRAND_STEPS.length - 1) return undefined;

    const timer = window.setTimeout(() => {
      setShowTagline(true);
    }, (STEP_DURATION_S + TAGLINE_PAUSE_S) * 1000);

    return () => window.clearTimeout(timer);
  }, [brandStep]);

  /* Phase 3 — cinematic pillar lines, then collapse to final one-line state */
  useEffect(() => {
    if (!showTagline) return undefined;

    const pillarStartMs = TAGLINE_DURATION_S * 1000;
    const timers = [];

    timers.push(
      window.setTimeout(() => {
        setPillarsActive(true);
        setPillarsVisible(true);
        setVisiblePillars(1);
      }, pillarStartMs)
    );

    for (let i = 1; i < PILLAR_LINES.length; i += 1) {
      timers.push(
        window.setTimeout(() => {
          setVisiblePillars(i + 1);
        }, pillarStartMs + i * PILLAR_STEP_S * 1000)
      );
    }

    const lastPillarMs = pillarStartMs + (PILLAR_LINES.length - 1) * PILLAR_STEP_S * 1000 + PILLAR_HOLD_S * 1000;

    timers.push(
      window.setTimeout(() => {
        setPillarsVisible(false);
      }, lastPillarMs)
    );

    timers.push(
      window.setTimeout(() => {
        setPillarsActive(false);
        setShowFinalLine(true);
      }, lastPillarMs + PILLAR_EXIT_S * 1000)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [showTagline]);

  return (
    <section
      className={`voice-brand-reveal${showFinalLine ? "" : " voice-brand-reveal--animating"}`.trim()}
      aria-live="polite"
    >
      <div className="voice-brand-reveal__glow" aria-hidden="true" />

      <div className="voice-brand-reveal__content">
        {showFinalLine ? (
          <motion.p
            className="voice-brand-reveal__final-line"
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="voice-brand-reveal__final-brand">{renderBrandText("V.O.I.C.E. NL")}</span>
            <span className="voice-brand-reveal__final-sep" aria-hidden="true">
              {" "}
              —{" "}
            </span>
            <span className="voice-brand-reveal__final-tagline">{TAGLINE}</span>
          </motion.p>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <motion.h1
                key={BRAND_STEPS[brandStep]}
                className="voice-brand-reveal__title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: STEP_DURATION_S, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderBrandText(BRAND_STEPS[brandStep])}
              </motion.h1>
            </AnimatePresence>

            <AnimatePresence>
              {showTagline ? (
                <motion.p
                  className="voice-brand-reveal__tagline"
                  initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: TAGLINE_DURATION_S, ease: [0.22, 1, 0.36, 1] }}
                >
                  {TAGLINE}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {pillarsActive ? (
                <motion.ul
                  className="voice-brand-reveal__pillars"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: pillarsVisible ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: PILLAR_EXIT_S, ease: "easeOut" }}
                >
                  {PILLAR_LINES.map((line, index) =>
                    index < visiblePillars ? (
                      <motion.li
                        key={index}
                        className="voice-brand-reveal__pillar"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {line}
                      </motion.li>
                    ) : null
                  )}
                </motion.ul>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
}

export default VoiceBrandReveal;
