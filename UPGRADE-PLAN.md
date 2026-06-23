# ZeroUpload V2 — Gold-Tier Upgrade Plan

Goal: become the most-searched private file tool of 2026–2027 — without ever
breaking the motto (no upload, no server, no signup, no leaving the page, $0).

## Pillars

### 1. UX: category hubs with format pickers (the friend feedback)
- New hubs: `/pdf`, `/image-converter`, `/audio-converter`, `/text`.
- Each hub has a **"from → to" dropdown picker** so users never hunt for a format.
- Hubs funnel into the existing per-pair SEO pages (both coexist).

### 2. PDF power suite (biggest SEO traffic on the internet)
All client-side via pdf-lib / pdf.js:
- Merge PDFs · Split PDF · Rotate · Reorder/Delete pages · Images → PDF ·
  PDF → images · Compress (lossy re-encode).
- Each gets its own page + keyword (merge-pdf, split-pdf, compress-pdf, …).

### 3. Image → Text (OCR)
- Tesseract.js (WASM, 100+ languages), lazy-loaded, language data on demand.
- Pages: `image-to-text`, `jpg-to-text`, `png-to-text`, `pdf-to-text` (via pdf.js + OCR).
- Honest caveat in UI: accuracy dips on blurry/skewed scans.

### 4. UI/UX glow-up (keep Quiet Luxury)
- Refined hubs, a delightful "drop → pick → done" flow, micro-interactions,
  better empty/progress/done states, mobile polish. The drop zone is the hero.

### 5. DEFERRED — Language translation
- No good fully-in-browser option that respects the motto (server/API breaks it;
  in-browser is Chrome-only or huge models). Defer, or ship later as a clearly
  labeled experimental, still-no-upload beta. Don't dilute the brand.

## Order of work
1. UX hubs + format pickers (fast, high impact).
2. PDF suite (merge/split/compress/rotate/organize) — the traffic engine.
3. OCR (image-to-text).
4. UI polish pass + accessibility + SEO (JSON-LD, sitemap) + Core Web Vitals.
5. Smoke-test every engine on the Cloudflare preview, then ship.

## Guardrails (see skills)
- `zeroupload-brand-system` — look/voice/motto.
- `client-side-conversion-playbook` — how to add engines without breaking things
  (WASM <25 MiB split, ESM core, lazy-load, memory guards, no silent failures).
- `frontend-design-principles` — craft bar.

## Definition of done (V2)
Every new tool runs 100% in-browser, works offline after load, shows real errors,
is mobile-safe, has its own SEO page, and keeps the site $0 to run.
