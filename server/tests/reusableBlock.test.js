import { describe, it, expect } from "vitest";
import { hydrateSections } from "../src/services/reusableBlockService.js";

describe("hydrateSections", () => {
  it("passes sections through unchanged when none are linked (no DB call needed)", async () => {
    const sections = [
      { sectionId: "sec-1", sectionType: "text", content: { heading: "Hello" } },
      { sectionId: "sec-2", sectionType: "hero", content: {}, linkedBlockId: null },
    ];
    const result = await hydrateSections(sections, { draft: true });
    expect(result).toBe(sections);
  });

  it("returns an empty array unchanged", async () => {
    const result = await hydrateSections([], { draft: false });
    expect(result).toEqual([]);
  });
});
