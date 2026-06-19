# CONTEXT — ZeroUpload working memory

> Continuity file. Whenever we stop, the latest state lives here so we can pick
> up instantly. Newest notes at the top.

## Current state (initial build)

- **Phase 0 (Foundation) is COMPLETE.** The app builds cleanly and generates
  **26 static pages**: 24 image-conversion pages + `/image-converter` hub +
  homepage, plus an auto-generated sitemap.
- The converter genuinely works in-browser via the Canvas API for the shipped
  formats. No file is ever uploaded.
- Repo: `adhamcodes/ZeroUpload`. Initial code delivered via Pull Request.

## Key decisions locked

| Decision | Choice | Why |
|---|---|---|
| Framework | Astro | SEO-first, static, mass page generation. |
| UI | React island + Tailwind v4 | Interactive widget + Quiet Luxury design. |
| Image engine | Canvas API | Native, instant, zero dependencies for MVP. |
| Hosting | Cloudflare Pages | Unlimited free bandwidth = $0 to scale. |
| Domain | zeroupload.app (placeholder in config) | Update `site` in `astro.config.mjs` when the real domain is bought. |
| Video | Excluded | Mobile browser memory crashes. |

## Shipped formats

- **Sources (decode):** PNG, JPG, JPEG, WEBP, GIF, BMP, SVG
- **Targets (encode):** PNG, JPG, JPEG, WEBP
- Pairs are auto-generated within the image category (same-category rule).

## Where things live

- SEO brain / all conversions: `src/data/conversions.ts`
- Page template (carpet-bomb): `src/pages/[from]-to-[to].astro`
- Conversion engine: `src/lib/convertImage.ts`
- Converter widget: `src/components/Converter.tsx`
- Design tokens: `src/styles/global.css`
- Site URL / integrations: `astro.config.mjs`

## How to add new conversions (the magic)

1. Add/flag a `Format` in `src/data/conversions.ts`.
2. If it needs a new engine (HEIC/PDF/audio), add a converter in `src/lib/` and
   wire it into the Converter component behind the same `convert()` shape.
3. Run `npm run build` — new pages appear automatically.

## Open TODOs / next session

- [ ] Buy + connect the real domain; update `site` in `astro.config.mjs` and the
      URLs in `public/robots.txt`.
- [ ] Deploy to Cloudflare Pages.
- [ ] Begin Phase 1: HEIC → JPG (highest-value next keyword).

## Known limitations / honest notes

- GIF/BMP/SVG are decode-only right now (Canvas can't reliably *encode* them),
  so they appear as sources, not targets. This is intentional and correct.
- Animated GIFs convert only their first frame (Canvas limitation). Fine for the
  common "gif to png" intent; revisit if data shows demand for animation.
