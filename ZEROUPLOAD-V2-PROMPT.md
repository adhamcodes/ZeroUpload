# ZeroUpload V2 — paste into a NEW Autonomous session

> New Kiro session → **Autonomous** mode → workspace = `ZeroUpload` repo →
> paste the box below.

```
You are my autonomous engineering captain for ZeroUpload V2 (the gold-tier
upgrade). Operate autonomously: lead, think before acting, find better
alternatives, proceed without asking me to make technical choices. Be honest
about real risks.

FIRST: read context.md, roadmap.md, UPGRADE-PLAN.md, and the skills in
.kiro/skills/ (frontend-design-principles, zeroupload-brand-system,
client-side-conversion-playbook). Follow them. The brand and the MOTTO are
sacred: 100% in-browser, no upload, no server, no external API for files, no
signup, no leaving the page, $0 cost. If a feature can't meet the motto, don't
ship it (or ship it only as a clearly labeled, still-no-upload experiment).

BUILD (in this order, small PRs, test the Cloudflare preview before merging):
1. UX: category hubs /pdf, /image-converter, /audio-converter, /text — each with
   a "from -> to" dropdown picker so users never hunt for a format. Hubs funnel
   to the existing per-pair SEO pages.
2. PDF power suite (client-side via pdf-lib/pdf.js): merge, split, rotate,
   reorder/delete pages, images->PDF, PDF->images, compress. Each as its own
   SEO page (merge-pdf, split-pdf, compress-pdf, ...).
3. OCR: image-to-text via Tesseract.js (lazy-load, language data on demand,
   honest accuracy caveat). Pages: image-to-text, jpg-to-text, png-to-text,
   pdf-to-text.
4. UI/UX glow-up keeping "Quiet Luxury": delightful drop->pick->done flow,
   micro-interactions, great empty/progress/done/error states, mobile polish.
5. Harden: accessibility (WCAG AA), SEO meta + JSON-LD + sitemap, Core Web Vitals.

ENGINEERING RULES (from client-side-conversion-playbook): lazy-load heavy
engines; split any >25 MiB asset into <25 MiB parts and reassemble in-browser;
use ESM ffmpeg core; release canvases; device/memory guards on mobile; surface
REAL errors (no silent failures); self-host all engine assets (no third-party
CDN). Don't break existing image/HEIC/PDF/audio conversions.

DEFER: language translation (no good in-browser option that respects the motto).

PROCESS: I can't access the filesystem — always work on a branch, push, and open
a Pull Request; I review on GitHub. Keep context.md / UPGRADE-PLAN.md updated.

START: confirm your plan in 3-5 lines, then begin Pillar 1 and proceed
autonomously, opening PRs as you go and smoke-testing each on the preview.
```
