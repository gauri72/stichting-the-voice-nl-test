import dotenv from "dotenv";
import dns from "node:dns";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import Event from "../src/models/Event.js";

dotenv.config();

dns.setServers(env.dnsServers.length ? env.dnsServers : ["8.8.8.8", "1.1.1.1"]);

const SLUG = "her-beats-her-night";

const FEATURED_FIELDS = {
  featured: true,
  showOnHomePage: true,
  showOnEventsPage: true,
  featuredPriority: 1,
  featuredTitle: "HerBeats HerNight 2026",
  featuredSubtitle: "A Night of Voices. A Celebration of Women.",
  featuredDescription:
    "An unforgettable evening celebrating women through music, connection, and shared stories — where every beat amplifies empowerment.",
  featuredBadgeText: "Featured Event",
  featuredCtaText: "Book Tickets",
  featuredDisplayMode: "Women-focused",
  featuredTextAlignment: "Left",
  featuredOverlayStrength: "Strong",
  featuredImageFocusPosition: "Top",
  status: "published",
};

async function main() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await connectDb(env.mongoUri, env.mongoDbName);

  let event = await Event.findOne({ slug: SLUG });

  if (event) {
    Object.assign(event, FEATURED_FIELDS);
    if (!event.featuredImageAlt) {
      event.featuredImageAlt = "HerBeats HerNight 2026 featured event banner";
    }
    await event.save();
    console.log(`[seed-featured-herbeats] Updated featured settings for "${event.title}" (${SLUG}).`);
  } else {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    futureDate.setHours(12, 0, 0, 0);

    event = await Event.create({
      title: "HerBeats HerNight 2026",
      slug: SLUG,
      description:
        "A Night of Voices. A Celebration of Women. Join us for an inspiring evening with The V.O.I.C.E. NL community.",
      date: futureDate,
      startTime: "20:00",
      endTime: "23:30",
      venueName: "Den Haag",
      venueAddress: "Den Haag, Netherlands",
      category: "Women-focused",
      salesEnabled: true,
      showOnDashboard: true,
      ...FEATURED_FIELDS,
      featuredImageAlt: "HerBeats HerNight 2026 featured event banner",
    });

    console.log(`[seed-featured-herbeats] Created event "${event.title}" (${SLUG}) with featured settings.`);
    console.log("  Note: Add ticket types in Admin → Events before opening ticket sales.");
  }

  console.log("[seed-featured-herbeats] Featured flags:");
  console.log(`  featured: ${event.featured}`);
  console.log(`  showOnHomePage: ${event.showOnHomePage}`);
  console.log(`  showOnEventsPage: ${event.showOnEventsPage}`);
  console.log(`  featuredPriority: ${event.featuredPriority}`);
}

main()
  .catch((error) => {
    console.error("[seed-featured-herbeats] Failed:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  });
