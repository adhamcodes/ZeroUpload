# START HERE — ZeroUpload

> Read this file first. It is the front door to the whole project.

## What is ZeroUpload?

ZeroUpload is a free web app that converts files **100% inside your browser**.
The file you convert **never leaves your device** — there is no upload, no
server, no account, and no limits. It even works offline.

**The one-line pitch:** _Convert files without uploading a thing._

## Why this exists (the business in 30 seconds)

Every big converter (Convertio, Zamzar, CloudConvert) does the conversion **on
their servers**, so every conversion costs them money (CPU + bandwidth). That
forces them to throttle users with limits and paywalls.

ZeroUpload flips the model:

1. **Conversion runs on the visitor's own device** (WebAssembly / Canvas).
   Our cost per conversion = **$0**.
2. **Hosting is static on Cloudflare Pages** with unlimited free bandwidth.
   Our cost to serve traffic ≈ **$0**.
3. We capture enormous, free search traffic via **programmatic SEO** — one page
   for every "X to Y" conversion keyword.
4. We monetise that traffic with display ads at a near-100% margin.

Zero marginal cost + huge organic traffic = the money machine.

## The two moats

1. **Privacy** — "your files never leave your device." Server-based competitors
   cannot copy this without going bankrupt.
2. **Aesthetic** — a clean, minimalist, premium "Quiet Luxury" interface that
   makes the cluttered 2010s-era competitors look ancient.

## Project map

| File | What it's for |
|------|----------------|
| `starthere.md` | This file — the overview. |
| `roadmap.md` | The full plan, phases, and what to build next. |
| `context.md` | Working memory — current state, decisions, where we left off. |
| `tutorial.md` | Step-by-step developer guide to run, edit, and deploy. |

## Tech stack (locked)

- **Astro** — static-site framework, SEO-first, generates thousands of pages.
- **React** (Astro island) — the interactive converter widget.
- **Tailwind CSS v4** — the Quiet Luxury design system.
- **Canvas API** — the shipped in-browser image conversion engine.
- **Cloudflare Pages** — $0 static hosting with unlimited bandwidth.

## Current status

✅ MVP shipped: image conversions (PNG, JPG, JPEG, WEBP, GIF, BMP, SVG sources →
PNG/JPG/JPEG/WEBP targets). 24 working conversion pages auto-generated, plus the
homepage and image hub. See `context.md` for the live status and `roadmap.md`
for what's next (HEIC, PDF, audio).
