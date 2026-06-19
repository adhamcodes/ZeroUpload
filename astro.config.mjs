// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// The public site URL. Update this to the real domain once it is live.
// Used by Astro for canonical URLs and by @astrojs/sitemap.
const SITE_URL = "https://zeroupload.app";

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
