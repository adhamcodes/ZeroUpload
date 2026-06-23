---
name: client-side-conversion-playbook
description: Engineering playbook for building 100%-in-browser file conversion/processing features (images, PDF, audio, OCR) with WASM/Canvas — no server, no upload, $0. Use when adding or fixing any ZeroUpload engine. Encodes hard-won lessons (WASM size limits, worker/core loading, lazy-loading, memory safety) and a feasibility matrix so new features ship without breaking the live engines.
---

# Client-Side Conversion Playbook

Battle-tested rules for adding in-browser conversion features without breaking the motto or the existing engines. Read before touching anything in `src/lib/`.

## Architecture (how ZeroUpload works)
- **Astro 5 (static) + React islands + Tailwind v4**, deployed on Cloudflare Pages. Build `npm run build` → `dist/`.
- **SEO engine:** `src/data/conversions.ts` (the "brain": formats + pairs + the engine each uses) + `src/pages/[from]-to-[to].astro` (auto-generates one page per pair). `src/data/customCopy.ts` = hand-written Markdown for top pages.
- **Engine dispatcher:** `src/lib/convert.ts` routes to `convertImage.ts` and `src/lib/engines/{heic,pdf,audio}.ts`. UI: `src/components/Converter.tsx`.
- **Add a format/page:** edit `conversions.ts` only → new pages auto-build.

## Lessons learned (do NOT relearn these the hard way)
1. **Lazy-load heavy engines.** Use dynamic `import()` so HEIC/PDF/audio/OCR payloads download only when used. Keeps the site instant.
2. **Cloudflare Pages rejects files > 25 MiB.** Big WASM (e.g. ffmpeg-core ~31 MiB) must be **split into <25 MiB parts at build time** (`scripts/copy-ffmpeg.mjs`) and **reassembled in the browser** (fetch parts → concat → Blob). Gitignore the generated parts; regenerate on build. Apply the same pattern to any future >25 MiB asset.
3. **ffmpeg.wasm worker needs the ESM core.** Vite bundles the worker as a *module* worker; it loads the core via `import(coreURL).default`, so serve `@ffmpeg/core/dist/esm` (has `export default`), NOT the UMD build. Pass the core as a same-origin URL; reassemble the wasm blob and revoke it after load.
4. **pdf.js v6:** `destroy()` is on the loading task, not the document; worker via `pdfjs-dist/build/pdf.worker.min.mjs?url`. Release each page canvas (`canvas.width=canvas.height=0`) to control memory.
5. **Memory safety on mobile:** detect device (userAgent + `deviceMemory`); cap files/bytes per batch on low-memory devices; process strictly sequentially with a small `setTimeout` "breathe" between items; show an "Optimizing memory…" state. Never hold two decoded files at once.
6. **No silent failures.** Surface the real error (string or Error) in the UI + `console.error`. If you cap something (e.g. PDF pages on mobile), tell the user.
7. **Self-host engine assets** (same-origin) — never load processing binaries from a third-party CDN (breaks the motto + offline). Cache via `public/_headers`.
8. **Verify before claiming done.** `npm run build` green ≠ feature works. Engines can only be confirmed in a real browser; recommend a smoke test on the Cloudflare preview.

## Feasibility matrix for new features (stay in-browser / $0)
- ✅ **Image ↔ image** (PNG/JPG/WEBP/GIF/BMP/SVG): Canvas API. Done.
- ✅ **HEIC → JPG/PNG/WEBP:** `heic-to` (libheif, wasm inlined). Done.
- ✅ **PDF tools — merge / split / rotate / reorder / delete pages / images→PDF:** `pdf-lib` (pure JS, no server). PDF→images: `pdf.js`. **Compress:** re-render/re-encode images via pdf.js + pdf-lib (lossy) — feasible, set expectations.
- ✅ **Audio** (mp3/wav/ogg/m4a/flac/aac): ffmpeg.wasm (ESM core, split). Done.
- ✅ **Image → Text (OCR):** **Tesseract.js** (WASM, 100+ languages, no server). Lazy-load; download language data on demand; honest accuracy caveat on skewed/low-res scans.
- ✅ **Image tools — compress / resize / crop / rotate / flip:** Canvas API (instant, no new heavy deps). Compress = `canvas.toBlob` with a quality value; iterate quality to hit a target file size (e.g. "under 100 KB"). Do NOT add merge/split for images — irrelevant to the medium.
- ✅ **Audio tools — trim/cut / merge/join / change bitrate:** ffmpeg.wasm (the audio engine is already loaded; reuse it).
- 🚫 **Language translation:** REMOVED / out of scope. No fully-in-browser option respects the motto (server/API breaks it). Do not add.
- 🚫 **Video transcode:** memory-crashes mobile browsers. Excluded by design.

## Adding a new tool (checklist)
1. Confirm it passes the **motto** (in-browser, no server, no upload, $0).
2. Add the engine in `src/lib/engines/` behind the `convert()` dispatcher shape; lazy-load it.
3. If it ships a >25 MiB asset, split it (lesson #2) and self-host.
4. Wire device/memory guards (lesson #5) and real error surfacing (lesson #6).
5. Register pages/keywords in `conversions.ts`; add hand copy in `customCopy.ts` for top pages.
6. `npm run build` → open the Cloudflare preview → smoke-test in a real browser → PR.
