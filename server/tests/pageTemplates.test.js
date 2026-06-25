import { describe, it, expect } from "vitest";
import { SYSTEM_TEMPLATES } from "../src/services/pageTemplateService.js";
import { SECTION_TYPES } from "../src/config/cmsConfig.js";

describe("SYSTEM_TEMPLATES", () => {
  it("seeds exactly the 8 named templates from the spec", () => {
    expect(SYSTEM_TEMPLATES).toHaveLength(8);
    const names = SYSTEM_TEMPLATES.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Landing Page",
        "Event Page",
        "Experience Page",
        "Story Page",
        "Membership Page",
        "Team Page",
        "Campaign Page",
        "Dashboard Page",
      ])
    );
  });

  it("has unique templateIds", () => {
    const ids = SYSTEM_TEMPLATES.map((t) => t.templateId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every blueprint section uses a real section type", () => {
    for (const template of SYSTEM_TEMPLATES) {
      expect(template.sectionBlueprint.length).toBeGreaterThan(0);
      for (const section of template.sectionBlueprint) {
        expect(SECTION_TYPES).toContain(section.sectionType);
      }
    }
  });

  it("orders sections sequentially from 0 within each template", () => {
    for (const template of SYSTEM_TEMPLATES) {
      const orders = template.sectionBlueprint.map((s) => s.order).sort((a, b) => a - b);
      expect(orders).toEqual(template.sectionBlueprint.map((_, i) => i));
    }
  });
});
