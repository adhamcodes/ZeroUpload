// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Current public deployment. Replace this only if ZeroUpload gets a domain you own.
const SITE_URL = "https://zeroupload-8e8.pages.dev";

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
