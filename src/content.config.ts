import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The /articles blog. Authority signals for AdSense + topical SEO depth.
 * Drop a new .md file in src/content/articles/ and it publishes automatically.
 */
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    excerpt: z.string(),
  }),
});

export const collections = { articles };
