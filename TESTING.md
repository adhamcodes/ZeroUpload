# ZeroUpload — Hard-Testing Handover

This is your click-by-click test plan for taking ZeroUpload through its paces on
**your phone and every PC browser** before launch. It also tells you exactly
**where to get test files of every format** so you never get stuck.

> The golden rule you can apply to *every* tool: **open the browser's Network
> tab (F12 → Network) and confirm your file is NEVER uploaded.** You should only
> ever see the site's own files and — for the AI tools — a one-time model
> download from `huggingface.co`. Your actual image/PDF/audio bytes never leave
> your device.

---

## 0. Where to test

**Test URL (current):** https://zeroupload-8e8.pages.dev
(When a PR has a Cloudflare preview, you can also test the preview link:
`https://<branch-with-dashes>.zeroupload-8e8.pages.dev`.)

### Browser / device matrix — try each tool on as many as you can

| Platform | Browsers to try |
|---|---|
| **Windows / Mac PC** | Chrome, Edge, Firefox, (Safari on Mac) |
| **Android phone** | Chrome, Firefox, Samsung Internet |
| **iPhone / iPad** | Safari (and Chrome — note: on iOS every browser is really Safari underneath) |

**What "pass" means everywhere:** the page loads, the tool works, the download
is correct, and the Network tab shows **no upload of your file**.

---

## 1. Where to get sample files of every format

You don't need to own every format — grab free, safe samples:

### Images
- **JPG / PNG / WEBP:** any photo from your phone, or download from
  [Unsplash](https://unsplash.com) / [Pexels](https://pexels.com) (free, no login).
- **HEIC:** take a photo on an iPhone (default format), or search "sample HEIC
  file download" — [file-examples.com](https://file-examples.com) has them.
- **GIF:** [Giphy](https://giphy.com) → right-click → save.
- **SVG / BMP:** file-examples.com, or export an SVG from any logo tool.
- **A deliberately small / blurry image** (for the AI Upscaler): take a normal
  photo and shrink it to ~300px wide in any editor, or screenshot a tiny
  thumbnail. This is the *best* way to see the upscaler shine.
- **A photo of a person / pet / product** (for the Background Remover).

### PDFs
- Any PDF you have (a bank statement, an invoice, a downloaded receipt).
- Free samples: [file-examples.com](https://file-examples.com) → Documents → PDF.
- **A scanned / image-heavy PDF** (for Compress PDF): scan a page with your
  phone's notes/scanner app and "save as PDF", or download a "sample scanned
  PDF".
- **A multi-page PDF** (for Split / Organize): any document with 3+ pages.

### Audio
- **MP3 / WAV:** record a voice memo on your phone and export, or
  [file-examples.com](https://file-examples.com) → Audio.
- **M4A:** iPhone Voice Memos export as M4A.
- **FLAC / OGG / AAC:** search "sample FLAC/OGG/AAC file download"
  (file-examples.com and [filesamples.com](https://filesamples.com) both have them).
- **Two or three short clips** (for Merge Audio).

> Tip: keep a small folder of test files (one of each format) so re-testing on a
> new browser takes 5 minutes, not 30.

---

## 2. Image tools

### 2.1 Image Converter — `/image-converter`
1. Drop a **PNG**. 
2. Confirm the "Convert from" and "Convert to" both show sensibly (from: PNG).
3. Set "Convert to" → **JPG**. Click Convert.
4. **Expect:** a JPG download that opens correctly and looks like the original.
5. Repeat a few combos: PNG→WEBP, WEBP→JPG, **HEIC→JPG** (important for iPhone
   users), GIF→PNG.
6. **Network tab:** no upload.

### 2.2 Compress Image — `/compress-image`
1. Drop a large JPG/PNG.
2. Drag the quality slider down. 
3. **Expect:** output file size drops, preview still looks acceptable, download
   works.

### 2.3 Resize Image — `/resize-image`
1. Drop an image.
2. Resize by **percentage** (e.g. 50%) → download → check dimensions halved.
3. Resize by **exact pixels** (e.g. 800px wide) → check the result.

### 2.4 Rotate & Flip Image — `/rotate-image`
1. Drop an image. Rotate 90°, then flip horizontally. 
2. **Expect:** preview updates each click; download matches the preview.

### 2.5 Crop Image — `/crop-image`
1. Drop an image, drag the crop box, try a fixed ratio (e.g. 1:1).
2. **Expect:** downloaded image is cropped exactly to the box.

---

## 3. AI tools (the flagships) 🌟

> These download a **one-time AI model** on first use (background remover ~ a few
> tens of MB; upscaler ~7 MB). Expect the first run to pause on a download bar,
> then be fast afterwards (cached). **Desktop Chrome/Edge is fastest.**

### 3.1 AI Image Upscaler — `/image-upscaler` (NEW flagship)
1. Drop a **small or blurry** image (e.g. ~300–600px wide). This is key — the
   tool is built to enlarge/clean *low-res* images.
2. Watch the one-time model download bar (first use only).
3. Wait for "Enhancing…" to finish.
4. **Expect:** a before/after **slider** appears — drag it left/right. The
   "after" should be 4× larger and visibly sharper/cleaner.
5. Click **Download PNG** → confirm the saved image is the bigger, sharper one.
6. **Honesty check (this is expected, not a bug):**
   - On a **huge** input image, you'll see a note that it was "scaled to fit
     before enhancing." That's the crash-prevention cap working.
   - On a **heavily** blurry or destroyed photo, results will be modest — the AI
     can't invent detail that was never there. The page says this plainly.
7. **Try the keyword pages too** (same tool, tailored copy): `/unblur-photo`,
   `/upscale-image`, `/restore-old-photos`, `/upscale-anime-art`,
   `/enhance-photo`, etc.
8. **Phone test:** try a *small* image first. If a very large image is slow or
   the tab struggles on an older phone, that's the known heavy-AI limitation —
   note the device/image so we can tune the cap.
9. **Network tab:** only the model from `huggingface.co` downloads — your image
   is never uploaded.

### 3.2 AI Background Remover — `/background-remover`
1. Drop a photo of a **person/pet/product** with a clear subject.
2. Wait for the model + processing.
3. **Expect:** before/after slider; the "after" has a transparent background.
4. Download the PNG → drop it onto a coloured background (e.g. in Slides) to
   confirm transparency.
5. Try a variant page: `/remove-background-from-product-photo`.

---

## 4. PDF tools — `/pdf`

### 4.1 Merge PDF — `/merge-pdf`
1. Add **two+ PDFs**, arrange order, Merge.
2. **Expect:** one combined PDF with pages in your chosen order.

### 4.2 Split PDF — `/split-pdf`
1. Drop a multi-page PDF. Extract a page range (e.g. 2–3) or split all.
2. **Expect:** correct pages out.

### 4.3 PDF to Text — `/pdf-to-text`
1. Drop a **text-based** PDF (not a scan). Extract.
2. **Expect:** selectable text appears. (A scanned/image PDF will return little
   or no text — that's expected, it has no real text layer.)

### 4.4 Rotate PDF — `/rotate-pdf`
1. Drop a PDF with a sideways page. Rotate. 
2. **Expect:** pages turn the right way up; download matches.

### 4.5 Compress PDF — `/compress-pdf` (NEW)
1. Drop a **scanned / image-heavy** PDF (this is what it's for).
2. Pick a quality (High / Balanced / Smallest). Compress.
3. **Expect:** smaller file with a before→after size readout.
4. **Honesty check (expected):** the page warns that **text becomes
   non-selectable** (pages are flattened to images). On a **text-only** PDF you
   may see little/no shrink and the warning that it didn't help — that's correct
   and intended.

### 4.6 Organize PDF — `/organize-pdf` (NEW)
1. Drop a multi-page PDF → thumbnails of every page appear.
2. Use the **arrows** to reorder, the **✕** to delete a page.
3. Click **Apply & download**.
4. **Expect:** the new PDF matches your arrangement; deleted pages are gone;
   it's lossless (no quality change). Deleting *every* page shows a friendly
   "add at least one back" message.

### 4.7 Images to PDF / PDF to Images — `/jpg-to-pdf`, `/pdf-to-jpg`
1. Combine a few JPGs into a PDF; then turn a PDF's pages back into images.
2. **Expect:** sensible output both ways.

---

## 5. Audio tools — `/audio-converter`

> First audio use downloads a one-time audio engine; later uses are quick.

### 5.1 Audio Converter — `/audio-converter`
1. Drop an **MP3**, convert to **WAV** (and try M4A→MP3, WAV→FLAC).
2. **Expect:** a playable converted file.

### 5.2 Trim Audio — `/trim-audio` (NEW)
1. Drop an audio file → it shows a player and start/end sliders.
2. Set a start and end, check the "Keeping X" readout, Trim & download.
3. **Expect:** the clip is exactly the section you chose, **same format,
   lossless** (sounds identical).

### 5.3 Merge Audio — `/merge-audio` (NEW)
1. Add **two+** audio files, reorder with the arrows, pick an output format,
   Merge & download.
2. **Expect:** one continuous track in your chosen order.
3. **Honesty check:** mixed formats are re-encoded to your chosen output (lossy
   if MP3/AAC). Pick **WAV/FLAC** output to stay lossless.

### 5.4 Compress Audio — `/compress-audio` (NEW)
1. Drop an audio file, pick a quality (192 / 128 / 96 / 64 kbps), Compress.
2. **Expect:** a smaller **MP3** with a "% smaller" readout.
3. **Honesty check:** this is **lossy** (re-encode to MP3) — the page says so.
   Lower kbps = smaller + lower fidelity.

---

## 6. Install as an app (PWA) — `/install`
1. **Chrome/Edge (desktop or Android):** click **Install app** → it should
   offer a one-tap install; the app opens in its own window.
2. **iPhone/Safari:** there's no install button (Apple's limitation) — use
   **Share → Add to Home Screen**. The page explains this honestly.
3. **Firefox desktop:** there is genuinely **no install** (Mozilla removed it) —
   the page says so plainly. Not a bug.

---

## 7. General site checks (every browser)
- [ ] Header **Upscale** and **Remove BG** links work (desktop + mobile menu).
- [ ] Homepage tiles include **AI Image Upscaler** (with an "AI" badge).
- [ ] Footer links all resolve (no 404s).
- [ ] `/tools` hub lists every tool with no "Coming Soon" tags left.
- [ ] A random made-up URL (e.g. `/nope`) shows the custom **404** page.
- [ ] Dark "Heritage Noir" theme looks right; nothing overlaps on a narrow phone.
- [ ] Privacy & Terms pages load and read accurately.

---

## 8. How to report what you find

For anything off, jot down:
1. **Which tool** + URL.
2. **Device + browser** (e.g. "Android Chrome", "iPhone Safari", "Windows Firefox").
3. **What you did** (the file type + steps).
4. **What happened** vs **what you expected**.
5. A screenshot if you can.

That's everything I need to fix it fast. Happy hard-testing, boss. 🫡
