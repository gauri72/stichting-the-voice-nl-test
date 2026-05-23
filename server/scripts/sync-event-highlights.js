/**
 * Sync Google Drive highlight images into server/data/event-highlights-manifest.json
 * Requires GOOGLE_DRIVE_API_KEY in server/.env and a public Drive folder.
 */
import "../src/config/env.js";
import { syncHighlightsManifest } from "../src/services/googleDriveHighlightsService.js";

try {
  const manifest = await syncHighlightsManifest();
  console.log("[sync:highlights] Manifest updated at", manifest.updatedAt);
  for (const [eventId, event] of Object.entries(manifest.events || {})) {
    console.log(`  - ${eventId}: ${event.images?.length || 0} images (${event.folderName || "flat range"})`);
    if (event.images?.[0]) {
      console.log(`      example: ${event.images[0].name}`);
    }
  }
} catch (error) {
  console.error("[sync:highlights] Failed:", error.message);
  process.exit(1);
}
