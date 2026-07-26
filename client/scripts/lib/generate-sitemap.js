import { promises as fs } from "fs";
import path from "path";
import { SitemapStream, streamToPromise } from "sitemap";

/**
 * Writes dist/sitemap.xml from the same route list used for prerendering.
 * robots.txt is a hand-committed static file (see client/public/robots.txt)
 * copied into dist/ by Vite itself — not generated here.
 */
export async function generateSitemap(routes, distDir, siteUrl) {
  const stream = new SitemapStream({ hostname: siteUrl });
  for (const route of routes) {
    stream.write({ url: route, changefreq: "weekly" });
  }
  stream.end();

  const buffer = await streamToPromise(stream);
  await fs.writeFile(path.join(distDir, "sitemap.xml"), buffer.toString());
}
