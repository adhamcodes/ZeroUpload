# ROADMAP — ZeroUpload

The master plan. Phases are ordered by impact-per-effort. We ship working,
indexable pages at every step — no page goes live unless its conversion truly
works (SEO trust > vanity page count).

---

## North Star

Become the default, private, free file converter that ranks on Google for every
"X to Y" conversion keyword, monetised by display ads at near-100% margin.

**Guardrails (decided):**
- 100% frontend. No backend, no database, no login.
- No video conversion yet (memory limits crash mobile browsers).
- Only ship conversions that genuinely run in-browser.

---

## Phase 0 — Foundation ✅ DONE

- [x] Astro + React + Tailwind v4 scaffold.
- [x] "Quiet Luxury" design system (`src/styles/global.css`).
- [x] Programmatic SEO engine (`src/data/conversions.ts` + `[from]-to-[to].astro`).
- [x] In-browser Canvas image engine (`src/lib/convertImage.ts`).
- [x] Converter island, homepage, image hub, sitemap, robots.txt, JSON-LD.
- [x] 24 working image-conversion pages generated at build.

## Phase 1 — Image domination (NEXT)

Goal: own the highest-volume image keywords.

- [ ] **HEIC → JPG / PNG** (huge volume; iPhone users). Engine: `heic-to` /
      `libheif` WASM, lazy-loaded only on HEIC pages.
- [ ] Add **AVIF** as source + target (jSquash WASM codecs).
- [ ] **ICO** target (favicon generator angle — "png to ico").
- [ ] Quality / resize controls in the converter (optional advanced panel).
- [ ] Per-format hero illustrations to lift the premium feel.
- [ ] Deploy to Cloudflare Pages + connect the real domain.
- [ ] Submit sitemap to Google Search Console + Bing Webmaster.

## Phase 2 — Documents (PDF)

- [ ] **PDF → JPG / PNG** (render pages). Engine: `pdf.js`.
- [ ] **Images → PDF** and **merge / split PDF**. Engine: `pdf-lib`.
- [ ] Cross-category conversion support in the SEO engine (relax the
      "same category only" rule in `generateConversions`).

## Phase 3 — Audio

- [ ] **MP3 / WAV / OGG / M4A / FLAC** conversions. Engine: `ffmpeg.wasm`.
- [ ] Lazy-load ffmpeg.wasm only on audio pages (it's a large binary).
- [ ] Audio files are small → no memory risk → flawless in-browser.

## Phase 4 — Scale the carpet-bomb

- [ ] Expand `conversions.ts` to every viable pair across all categories.
- [ ] Category hub pages for documents + audio.
- [ ] Blog / guides cluster for informational keywords ("what is webp?").
- [ ] Programmatic internal-link optimisation.

## Phase 5 — Monetisation

- [ ] Integrate a privacy-respecting display ad network.
- [ ] A/B test ad placement vs. bounce.
- [ ] Optional "Pro" (batch presets, advanced options) — not required to win.

## Phase 6 — Growth / virality

- [ ] "Works offline — watch" demo video for TikTok / X / Reddit.
- [ ] Outreach to privacy creators and communities (r/privacy etc.).
- [ ] Open-source trust signals (public repo, transparent "no upload" claim).

---

## Explicitly NOT doing (for now)

- Video conversion (mobile memory crashes).
- Anything requiring a server, database, or user accounts.
- Storing or logging user files (we never see them — that's the point).
