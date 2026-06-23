# ZeroUpload V2 — Gold-Tier Upgrade Plan

Goal: become the most-searched private file tool of 2026–2027 — without EVER
breaking our mandatory requirements, which deliver our company motto **"Your
Files Are Nobody's Business"** (no upload, no server, no signup, no leaving the
page, no external API for files, $0 cost). Every tool below is 100% in-browser.

## Core principle: each media type gets tools that fit ITS nature
"Merge/split" is a PDF (document/page) concept — we do NOT force it onto images
or audio. Instead, each section gets the high-volume tools that actually belong
to it. Every tool = its own SEO page.

## Pillar 0 — UX: category hubs with format pickers (the friend feedback)
- Hubs: `/pdf`, `/image-converter`, `/audio-converter`, `/text`.
- Each hub has a **"from → to" dropdown picker** + a row of that section's tools,
  so users never hunt for a format.
- Hubs funnel into the existing per-pair SEO pages (both coexist).

## Pillar 1 — PDF power suite (biggest SEO traffic) — pdf-lib / pdf.js
- Merge · Split · Compress · Rotate · Reorder/Delete pages · Images → PDF · PDF → images.
- Pages/keywords: merge-pdf, split-pdf, compress-pdf, rotate-pdf, pdf-to-jpg, jpg-to-pdf, …

## Pillar 2 — Image power tools (massive volume) — Canvas API
- **Compress image** (target-size aware, e.g. "to 100 KB"), **Resize image**,
  **Crop image**, **Rotate/Flip**. (NOT merge/split — irrelevant for images.)
- Pages/keywords: compress-image, resize-image, crop-image, rotate-image,
  reduce-image-size, image-to-100kb, …
- All instant, Canvas-based, no new heavy dependencies.

## Pillar 3 — Image → Text (OCR) — Tesseract.js (WASM)
- Lazy-loaded; language data on demand; honest accuracy caveat (blurry/skewed).
- Pages: image-to-text, jpg-to-text, png-to-text, pdf-to-text (pdf.js + OCR).

## Pillar 4 — Audio power tools (nice-to-have) — ffmpeg.wasm (already loaded)
- **Trim/cut**, **Merge/join**, **change bitrate/compress**.
- Pages: cut-audio, trim-mp3, merge-audio, compress-audio.

## Pillar 5 — UI/UX glow-up (keep "Quiet Luxury")
- Delightful "drop → pick → done" flow, micro-interactions, great
  empty/progress/done/error states, full mobile polish. The drop zone is hero.

## Pillar 6 — Harden (SEO + quality)
- Accessibility WCAG AA, unique meta + titles, Hotel/SoftwareApplication JSON-LD,
  auto sitemap, Core Web Vitals (fast images, lazy-load), internal-link clusters.

## REMOVED — Language translation
Cut entirely. No fully-in-browser option respects the motto (server/API breaks
it). Out of scope; do not add. Focus the energy on PDF + image tools (far bigger
traffic anyway).

## Order of work (small PRs, smoke-test each on the Cloudflare preview)
1. Pillar 0 (hubs + pickers) — fast, high impact.
2. Pillar 1 (PDF suite) — the traffic engine.
3. Pillar 2 (image compress + resize first, then crop + rotate).
4. Pillar 3 (OCR).
5. Pillar 4 (audio trim + merge).
6. Pillars 5–6 (polish + harden), then ship.

## Guardrails (see .kiro/skills/)
- `zeroupload-brand-system` — look/voice/motto + the hub UX.
- `client-side-conversion-playbook` — how to add engines safely (WASM <25 MiB
  split, ESM core, lazy-load, memory guards, no silent failures) + feasibility.
- `frontend-design-principles` — the craft bar.

## Definition of done (V2)
Every tool runs 100% in-browser, works offline after load, shows real errors, is
mobile-safe, has its own SEO page, and keeps the site $0 to run. Motto unbroken.
