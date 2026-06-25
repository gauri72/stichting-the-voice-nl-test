import { describe, it, expect } from "vitest";
import { SECTION_TYPES } from "../src/config/cmsConfig.js";
import { BASE_SECTION_FIELDS, COMPONENT_DEFINITIONS } from "../src/config/componentRegistryDefaults.js";

describe("componentRegistryDefaults", () => {
  it("registers every section type from cmsConfig", () => {
    const registeredKeys = COMPONENT_DEFINITIONS.map((c) => c.componentKey);
    for (const sectionType of SECTION_TYPES) {
      expect(registeredKeys).toContain(sectionType);
    }
    expect(registeredKeys).toHaveLength(SECTION_TYPES.length);
  });

  it("has no duplicate component keys", () => {
    const keys = COMPONENT_DEFINITIONS.map((c) => c.componentKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every definition has a displayName and category", () => {
    for (const def of COMPONENT_DEFINITIONS) {
      expect(def.displayName).toBeTruthy();
      expect(def.category).toBeTruthy();
    }
  });

  it("marks hasDedicatedRenderer consistently with rendererKey", () => {
    for (const def of COMPONENT_DEFINITIONS) {
      if (def.hasDedicatedRenderer) {
        expect(def.rendererKey).toBe(def.componentKey);
      } else {
        expect(def.rendererKey).toBe("");
      }
    }
  });

  it("base section fields each declare a path and category", () => {
    expect(BASE_SECTION_FIELDS.length).toBeGreaterThan(0);
    for (const field of BASE_SECTION_FIELDS) {
      expect(field.key).toBeTruthy();
      expect(field.label).toBeTruthy();
      expect(field.path).toBeTruthy();
      expect(["text", "media", "cta", "style", "layout"]).toContain(field.category);
    }
  });
});
