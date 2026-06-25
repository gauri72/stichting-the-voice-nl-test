import { describe, it, expect } from "vitest";
import { DEFAULT_DESIGN_SYSTEM } from "../src/services/designSystemService.js";
import { ALLOWED_FONT_FAMILIES } from "../src/models/DesignSystem.js";

describe("DEFAULT_DESIGN_SYSTEM", () => {
  it("has all six color tokens as hex values", () => {
    const keys = ["primary", "secondary", "accent", "success", "warning", "error"];
    expect(Object.keys(DEFAULT_DESIGN_SYSTEM.colors).sort()).toEqual(keys.sort());
    for (const value of Object.values(DEFAULT_DESIGN_SYSTEM.colors)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("defaults to allowed font families only", () => {
    expect(ALLOWED_FONT_FAMILIES).toContain(DEFAULT_DESIGN_SYSTEM.typography.headingFont);
    expect(ALLOWED_FONT_FAMILIES).toContain(DEFAULT_DESIGN_SYSTEM.typography.bodyFont);
  });

  it("defines all four button variants", () => {
    expect(Object.keys(DEFAULT_DESIGN_SYSTEM.buttons).sort()).toEqual(["ghost", "outline", "primary", "secondary"]);
  });
});

describe("ALLOWED_FONT_FAMILIES", () => {
  it("matches the spec's 12 open-source fonts", () => {
    expect(ALLOWED_FONT_FAMILIES).toHaveLength(12);
    expect(ALLOWED_FONT_FAMILIES).toContain("Inter");
    expect(ALLOWED_FONT_FAMILIES).toContain("Cinzel");
  });
});
