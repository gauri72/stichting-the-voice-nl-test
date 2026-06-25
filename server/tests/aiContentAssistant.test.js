import { describe, it, expect, afterEach } from "vitest";
import env from "../src/config/env.js";
import { runAiAction, isAiAssistantConfigured, AI_ACTIONS } from "../src/services/aiContentAssistantService.js";

describe("aiContentAssistantService.isAiAssistantConfigured", () => {
  const originalKey = env.anthropic.apiKey;
  afterEach(() => {
    env.anthropic.apiKey = originalKey;
  });

  it("is false when no API key is set", () => {
    env.anthropic.apiKey = "";
    expect(isAiAssistantConfigured()).toBe(false);
  });

  it("is true once an API key is set", () => {
    env.anthropic.apiKey = "sk-ant-example";
    expect(isAiAssistantConfigured()).toBe(true);
  });
});

describe("aiContentAssistantService.runAiAction validation", () => {
  it("rejects an unknown action before touching the network", async () => {
    await expect(runAiAction("not_a_real_action", "some text")).rejects.toMatchObject({ status: 400 });
  });

  it("rejects empty text", async () => {
    await expect(runAiAction("rewrite", "")).rejects.toMatchObject({ status: 400 });
  });

  it("reports 503 'not configured' when no API key is set, for a valid action+text", async () => {
    const originalKey = env.anthropic.apiKey;
    env.anthropic.apiKey = "";
    await expect(runAiAction("rewrite", "Some real content")).rejects.toMatchObject({ status: 503 });
    env.anthropic.apiKey = originalKey;
  });
});

describe("AI_ACTIONS", () => {
  it("covers every action named in the CMS spec", () => {
    expect(Object.keys(AI_ACTIONS).sort()).toEqual(
      [
        "expand",
        "generate_alt_text",
        "generate_cta",
        "generate_meta_description",
        "improve_seo",
        "make_mobile_friendly",
        "rewrite",
        "shorten",
      ].sort()
    );
  });
});
