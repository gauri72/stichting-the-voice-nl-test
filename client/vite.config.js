import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "pwa/icon-192.png", "pwa/icon-512.png"],
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        id: "/",
        name: "Stichting The V.O.I.C.E. NL",
        short_name: "V.O.I.C.E.",
        description:
          "Events, membership, sponsorship, and community programmes from Stichting The V.O.I.C.E. NL.",
        theme_color: "#6338c2",
        background_color: "#080d18",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        categories: ["nonprofit", "lifestyle", "events"],
        icons: [
          {
            src: "/pwa/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Events",
            short_name: "Events",
            url: "/events",
            icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Membership",
            short_name: "Member",
            url: "/membership",
            icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Donate",
            short_name: "Donate",
            url: "/donate",
            icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}", "favicon.png"],
        globIgnores: ["**/events-highlights/**"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
