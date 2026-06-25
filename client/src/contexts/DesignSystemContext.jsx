import { createContext, useContext, useEffect, useState } from "react";
import { useCmsDesignSystem } from "../hooks/useCmsPage.js";

const DesignSystemContext = createContext(null);

const GOOGLE_FONT_HREF_ID = "voice-design-system-fonts";

function applyCssVariables(designSystem) {
  if (!designSystem) return;
  const root = document.documentElement.style;
  const { colors = {}, typography = {}, buttons = {}, layout = {} } = designSystem;

  Object.entries(colors).forEach(([key, value]) => root.setProperty(`--voice-color-${key}`, value));

  if (typography.headingFont) root.setProperty("--voice-font-heading", `"${typography.headingFont}"`);
  if (typography.bodyFont) root.setProperty("--voice-font-body", `"${typography.bodyFont}"`);
  Object.entries(typography.fontSizes || {}).forEach(([key, value]) => root.setProperty(`--voice-font-size-${key}`, value));
  Object.entries(typography.fontWeights || {}).forEach(([key, value]) => root.setProperty(`--voice-font-weight-${key}`, value));
  Object.entries(typography.lineHeights || {}).forEach(([key, value]) => root.setProperty(`--voice-line-height-${key}`, value));

  Object.entries(buttons).forEach(([variant, styles]) => {
    Object.entries(styles || {}).forEach(([prop, value]) => root.setProperty(`--voice-button-${variant}-${prop}`, value));
  });

  Object.entries(layout.spacing || {}).forEach(([key, value]) => root.setProperty(`--voice-spacing-${key}`, value));
  Object.entries(layout.borderRadius || {}).forEach(([key, value]) => root.setProperty(`--voice-radius-${key}`, value));
  Object.entries(layout.shadows || {}).forEach(([key, value]) => root.setProperty(`--voice-shadow-${key}`, value));
}

function applyGoogleFonts(designSystem) {
  const families = [designSystem?.typography?.headingFont, designSystem?.typography?.bodyFont].filter(Boolean);
  const unique = [...new Set(families)];
  if (!unique.length) return;

  let link = document.getElementById(GOOGLE_FONT_HREF_ID);
  if (!link) {
    link = document.createElement("link");
    link.id = GOOGLE_FONT_HREF_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  const familyParams = unique.map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join("&");
  link.href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
}

export function DesignSystemProvider({ children }) {
  const { designSystem, loading } = useCmsDesignSystem();
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!designSystem) return;
    applyCssVariables(designSystem);
    applyGoogleFonts(designSystem);
    setApplied(true);
  }, [designSystem]);

  return (
    <DesignSystemContext.Provider value={{ designSystem, loading, applied }}>
      {children}
    </DesignSystemContext.Provider>
  );
}

export function useDesignSystem() {
  const ctx = useContext(DesignSystemContext);
  if (!ctx) {
    throw new Error("useDesignSystem must be used within DesignSystemProvider");
  }
  return ctx;
}
