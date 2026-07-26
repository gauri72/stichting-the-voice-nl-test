import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { preview } from "vite";
import { chromium } from "playwright";
import { enumerateRoutes, CRITICAL_ROUTES } from "./lib/enumerate-routes.js";
import { generateSitemap } from "./lib/generate-sitemap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../dist");
const API_BASE = (process.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

// PREVIEW_ORIGIN is what Playwright actually navigates to — the local
// preview server started below, which is the only thing running during the
// build (the real SITE_URL isn't live with this build's content yet). Pages
// set og:url etc. from window.location.href while running there, so any
// stray PREVIEW_ORIGIN reference in captured HTML gets rewritten to the real
// public SITE_URL before writing to disk (see rewriteToPublicUrl below).
const PREVIEW_PORT = 4173;
const PREVIEW_ORIGIN = `http://localhost:${PREVIEW_PORT}`;
const SITE_URL = (process.env.SITE_URL || PREVIEW_ORIGIN).replace(/\/$/, "");

function rewriteToPublicUrl(html) {
  if (SITE_URL === PREVIEW_ORIGIN) return html;
  return html.split(PREVIEW_ORIGIN).join(SITE_URL);
}

const GOTO_TIMEOUT_MS = 60_000;
const READY_TIMEOUT_MS = 60_000;
const API_WARMUP_TIMEOUT_MS = 90_000;
const API_WARMUP_INTERVAL_MS = 5_000;

// Known "still loading" markers in this codebase — if any of these are still
// present in the captured HTML, the page was captured before its real
// content rendered, regardless of what the readiness marker said. Different
// components on the same page can settle independently (e.g. header/footer
// vs. main content), so the marker alone isn't a sufficient wait condition —
// see readyPredicate below.
const LOADING_INDICATORS = ["cms-page-loading", "vco-loading-dots"];
const LOADING_INDICATOR_SELECTOR = LOADING_INDICATORS.map((c) => `.${c}`).join(", ");

async function warmApi() {
  const deadline = Date.now() + API_WARMUP_TIMEOUT_MS;
  console.log(`[prerender] Warming API at ${API_BASE}/api/health ...`);
  for (;;) {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        console.log("[prerender] API is warm.");
        return;
      }
    } catch {
      // ignore — API may still be waking up
    }
    if (Date.now() >= deadline) {
      console.warn("[prerender] API did not respond within the warmup window — proceeding anyway.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, API_WARMUP_INTERVAL_MS));
  }
}

function validateCapturedHtml(html) {
  const reasons = [];
  if (!html.includes('data-prerender-ready="true"')) {
    reasons.push("readiness marker missing from captured HTML");
  }
  for (const indicator of LOADING_INDICATORS) {
    if (html.includes(indicator)) {
      reasons.push(`loading indicator still present ("${indicator}")`);
    }
  }
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    reasons.push("empty or missing <title>");
  }
  return reasons;
}

function distPathForRoute(route) {
  if (route === "/") return path.join(DIST_DIR, "index.html");
  const segments = route.split("/").filter(Boolean);
  return path.join(DIST_DIR, ...segments, "index.html");
}

// vite preview falls back to dist/index.html for any path with no matching
// file — but as routes get prerendered in sequence, dist/index.html itself
// gets overwritten with the homepage's *already-prerendered* output (marker
// attribute and all). Every route processed after that would then load an
// initial document that already has the readiness marker baked in from a
// stale previous page, resolving the wait before the real route's own data
// has loaded. Pre-seed every route's own path with the original clean SPA
// shell before the crawl starts, so each one gets a real file match — never
// a stale fallback — from the very first navigation.
async function seedCleanShellForEachRoute(routes) {
  const originalIndexHtml = await fs.readFile(path.join(DIST_DIR, "index.html"), "utf8");
  for (const route of routes) {
    if (route === "/") continue;
    const outputPath = distPathForRoute(route);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, originalIndexHtml);
  }
}

// The built bundle calls the API at its real absolute URL (baked in via
// VITE_API_BASE_URL, required so real end users' browsers — served from a
// different origin than the API — can reach it). That means Playwright's
// browser, navigating the preview server at a *local* origin, would send
// real cross-origin requests the API's CORS policy (which only allows the
// actual deployed CLIENT_URL) rejects — every page would silently render
// its error/not-found state instead of real content. Intercept those
// requests and fulfill them with a server-side Node fetch instead, which
// isn't subject to browser CORS at all, so the app gets real data without
// touching server CORS config or requiring a second build.
async function installApiProxy(page) {
  await page.route(`${API_BASE}/**`, async (route) => {
    const req = route.request();
    try {
      const res = await fetch(req.url(), {
        method: req.method(),
        headers: req.headers(),
        body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postData(),
      });
      const body = Buffer.from(await res.arrayBuffer());
      const headers = Object.fromEntries(res.headers.entries());
      delete headers["content-encoding"]; // body above is already decoded
      // The real API only allows the deployed CLIENT_URL's origin — override
      // for this local-preview fulfillment, or the browser's own CORS check
      // rejects the response even though it never touched the real network.
      headers["access-control-allow-origin"] = "*";
      delete headers["access-control-allow-credentials"];
      await route.fulfill({ status: res.status, headers, body });
    } catch (error) {
      console.warn(`[prerender] Proxy fetch failed for ${req.url()}: ${error.message}`);
      await route.abort("failed");
    }
  });
}

async function prerenderRoute(browser, route) {
  // A fresh page (and freshly bound route handler) per route — sharing one
  // page/handler across sequential goto()s let a slow in-flight proxied
  // fetch from one navigation bleed into the next (observed as accumulating
  // ERR_FAILED requests and pages silently rendering their error state).
  const page = await browser.newPage();
  try {
    await installApiProxy(page);

    const url = `${PREVIEW_ORIGIN}${route}`;
    // domcontentloaded, not networkidle — pages with a Turnstile CAPTCHA
    // widget (contact/quote forms) never reach networkidle reliably, since
    // Turnstile actively probes for bot-like automation (which headless
    // Chromium inherently looks like) with variable-length background
    // requests unrelated to actual content readiness. The real gate is the
    // deterministic marker below, not network quiescence.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS });
    // Wait for both the marker AND the absence of any known loading
    // indicator — different async pieces on one page (e.g. CmsAwarePage's
    // own fetch vs. an embedded carousel's) can settle at different times,
    // so the marker appearing isn't on its own proof everything has.
    const readyPredicate = (selector) =>
      document.documentElement.hasAttribute("data-prerender-ready") &&
      !document.querySelector(selector);
    await page.waitForFunction(readyPredicate, LOADING_INDICATOR_SELECTOR, { timeout: READY_TIMEOUT_MS });
    // Re-confirm after a short settle — some pages' loading state briefly
    // flickers true again right after first appearing ready (observed on
    // pages whose data-fetch .then()/.finally() land in separate renders),
    // so a single instant of "ready" isn't reliable proof on its own.
    await page.waitForTimeout(300);
    await page.waitForFunction(readyPredicate, LOADING_INDICATOR_SELECTOR, { timeout: READY_TIMEOUT_MS });

    const html = await page.content();
    const problems = validateCapturedHtml(html);
    if (problems.length) {
      throw new Error(`validation failed: ${problems.join("; ")}`);
    }

    const outputPath = distPathForRoute(route);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, rewriteToPublicUrl(html));
    return outputPath;
  } finally {
    await page.close();
  }
}

async function main() {
  await warmApi();

  console.log("[prerender] Enumerating routes ...");
  const routes = await enumerateRoutes();
  console.log(`[prerender] ${routes.length} routes to prerender.`);

  console.log("[prerender] Seeding a clean SPA shell at every route's path ...");
  await seedCleanShellForEachRoute(routes);

  console.log("[prerender] Starting local preview server over dist/ ...");
  const previewServer = await preview({ preview: { port: PREVIEW_PORT }, root: path.resolve(__dirname, "..") });
  const serverUrl = previewServer.resolvedUrls?.local?.[0] || `${PREVIEW_ORIGIN}/`;
  console.log(`[prerender] Preview server running at ${serverUrl}`);

  const browser = await chromium.launch();

  const failures = [];
  const succeeded = [];

  for (const route of routes) {
    const isCritical = CRITICAL_ROUTES.has(route);
    try {
      const outputPath = await prerenderRoute(browser, route);
      succeeded.push(route);
      console.log(`[prerender] OK   ${route} -> ${path.relative(DIST_DIR, outputPath)}`);
    } catch (error) {
      failures.push({ route, isCritical, message: error.message });
      console.error(`[prerender] FAIL ${route}${isCritical ? " (CRITICAL)" : ""}: ${error.message}`);
    }
  }

  await browser.close();
  await new Promise((resolve) => previewServer.httpServer.close(resolve));

  console.log(`[prerender] ${succeeded.length}/${routes.length} routes prerendered successfully.`);

  console.log("[prerender] Generating sitemap.xml ...");
  await generateSitemap(routes, DIST_DIR, SITE_URL);

  const criticalFailures = failures.filter((f) => f.isCritical);
  if (criticalFailures.length) {
    console.error("[prerender] Critical route(s) failed to prerender — failing the build:");
    for (const f of criticalFailures) console.error(`  - ${f.route}: ${f.message}`);
    process.exit(1);
  }

  if (failures.length) {
    console.warn(
      `[prerender] ${failures.length} non-critical route(s) failed and will fall back to the SPA shell (not a build failure):`
    );
    for (const f of failures) console.warn(`  - ${f.route}: ${f.message}`);
  }
}

main().catch((error) => {
  console.error("[prerender] Unexpected failure:", error);
  process.exit(1);
});
