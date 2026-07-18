import { describe, it, expect, afterEach } from "vitest";
import env from "../src/config/env.js";
import { extensionFor, buildPublicUrl, isMediaStorageConfigured } from "../src/services/mediaStorageService.js";
import { MEDIA_PUBLIC_CATEGORIES, MEDIA_PRIVATE_CATEGORIES } from "../src/models/MediaAsset.js";

describe("mediaStorageService.extensionFor", () => {
  it("maps known mime types to the right extension", () => {
    expect(extensionFor("image/png")).toBe("png");
    expect(extensionFor("image/svg+xml")).toBe("svg");
    expect(extensionFor("image/webp")).toBe("webp");
    expect(extensionFor("image/jpeg")).toBe("jpg");
  });

  it("falls back to jpg for unrecognized types", () => {
    expect(extensionFor("application/octet-stream")).toBe("jpg");
  });
});

describe("mediaStorageService.buildPublicUrl", () => {
  const originalDomain = env.aws.cloudFrontDomain;
  afterEach(() => {
    env.aws.cloudFrontDomain = originalDomain;
  });

  it("uses the CloudFront domain when configured", () => {
    env.aws.cloudFrontDomain = "d111111abcdef8.cloudfront.net";
    expect(buildPublicUrl("public/cms/MEDIA-2026-000001/original.jpg")).toBe(
      "https://d111111abcdef8.cloudfront.net/public/cms/MEDIA-2026-000001/original.jpg"
    );
  });

  it("falls back to a direct S3 URL when CloudFront isn't configured yet", () => {
    env.aws.cloudFrontDomain = "";
    const url = buildPublicUrl("public/cms/MEDIA-2026-000001/original.jpg");
    expect(url).toContain(env.aws.s3Bucket);
    expect(url).toContain(env.aws.region);
    expect(url.startsWith("https://")).toBe(true);
  });
});

describe("mediaStorageService.isMediaStorageConfigured", () => {
  const originalKey = env.aws.accessKeyId;
  const originalSecret = env.aws.secretAccessKey;
  afterEach(() => {
    env.aws.accessKeyId = originalKey;
    env.aws.secretAccessKey = originalSecret;
  });

  it("is false when credentials are missing", () => {
    env.aws.accessKeyId = "";
    env.aws.secretAccessKey = "";
    expect(isMediaStorageConfigured()).toBe(false);
  });

  it("is true when both credentials are present", () => {
    env.aws.accessKeyId = "AKIAEXAMPLE";
    env.aws.secretAccessKey = "secretexample";
    expect(isMediaStorageConfigured()).toBe(true);
  });
});

describe("MediaAsset category layout", () => {
  it("matches the spec's public/private bucket prefixes", () => {
    expect(MEDIA_PUBLIC_CATEGORIES).toEqual([
      "cms",
      "events",
      "team",
      "logos",
      "reviews",
      "highlights",
      "business_profiles",
    ]);
    expect(MEDIA_PRIVATE_CATEGORIES).toEqual([
      "tickets",
      "memberships",
      "invoices",
      "receipts",
      "contracts",
      "reports",
      "budget-sheets",
      "technical-riders",
      "stage-plans",
    ]);
  });

  it("has no overlap between public and private categories", () => {
    const overlap = MEDIA_PUBLIC_CATEGORIES.filter((c) => MEDIA_PRIVATE_CATEGORIES.includes(c));
    expect(overlap).toHaveLength(0);
  });
});
