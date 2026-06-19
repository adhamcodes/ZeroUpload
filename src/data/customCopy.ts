/**
 * CUSTOM COPY — hand-written Markdown injected into the highest-volume pages.
 *
 * This is the anti-"thin content" weapon. The programmatic template already
 * produces genuinely different copy per pair (from each format's editorial
 * fields), but for our top ~50 money keywords we layer in unique, expert
 * Markdown here. Google sees real, differentiated editorial content.
 *
 * HOW TO USE: add an entry keyed by the conversion slug. The Markdown is
 * rendered into the page under an "Expert guide" section. Write freely —
 * headings, lists, bold, links all work.
 *
 * Coverage target: top 50 highest-search-volume conversions (see roadmap).
 * Pages without an entry simply fall back to the (still unique) auto copy.
 */

export const CUSTOM_COPY: Record<string, string> = {
  "png-to-jpg": `
### When PNG to JPG is the right move

PNG is brilliant for graphics, but it is the wrong tool for photographs. A
photo saved as PNG can easily be **5–10× larger** than the same photo as JPG,
because PNG never throws away data. If you are emailing holiday photos, uploading
to a website, or hitting an "image too large" limit, converting PNG to JPG is
almost always the fix.

**Watch out for transparency.** PNG can have a transparent background; JPG
cannot. When ZeroUpload converts a transparent PNG to JPG, those see-through
areas are filled with **white** (the standard, expected behaviour) so you never
end up with ugly black blocks.

**Quality tip:** JPG is lossy, so avoid repeatedly re-saving the same file as
JPG. Convert once from your original PNG and keep that master.
`,
  "jpg-to-png": `
### Why convert JPG to PNG?

The honest answer: converting JPG to PNG will **not** restore quality the JPG
already lost — that information is gone. But there are real, legitimate reasons
to do it:

- You need a **lossless master** to edit without further degradation.
- A tool or platform **only accepts PNG**.
- You want to **add transparency** in an editor afterwards (JPG can't store it).

ZeroUpload does this instantly and privately in your browser. Your image is
never uploaded.
`,
  "webp-to-png": `
### Converting WEBP to PNG

WebP is a modern, efficient format — but plenty of desktop apps, older
software, and some workflows still don't accept it. Converting WebP to PNG gives
you a **universally compatible, lossless** file with full transparency
preserved.

This is the most reliable way to "rescue" a WebP you downloaded but can't open
in your usual editor. Because ZeroUpload runs locally, even sensitive images
stay completely private.
`,
  "svg-to-png": `
### From scalable vector to a perfect raster

SVG is resolution-independent, which is fantastic — until you hit a platform
that won't accept vectors (Instagram, many marketplaces, certain document
tools). Converting SVG to PNG **rasterises** your crisp vector into a pixel
image with transparency intact.

ZeroUpload renders the SVG in your browser and exports a clean PNG. For
print-quality output, start from an SVG with generous dimensions so the
rasterised PNG has plenty of resolution.
`,
  "heic-to-jpg": `
### The iPhone photo problem, solved

Since iOS 11, iPhones save photos as **HEIC** to save space. The catch: many
websites, Windows PCs, and older apps can't open HEIC at all. That's why
"HEIC to JPG" is one of the most-searched conversions on the internet.

Converting HEIC to JPG makes your iPhone photos open **anywhere**. And with
ZeroUpload it happens on your own device — your personal photos are never
uploaded to a stranger's server, which matters a great deal for private images.

Drop your HEIC files above (you can do several at once) and download standard
JPGs in seconds. Nothing is uploaded, and it even works with your internet off.
`,
  "pdf-to-jpg": `
### Turn PDF pages into images

Sometimes you don't need the whole PDF — you need a **picture of a page** to
post, embed, or text to someone. Converting PDF to JPG renders each page as an
image you can use anywhere.

ZeroUpload uses Mozilla's pdf.js to render your pages **inside your browser**, so
even confidential documents (contracts, statements, IDs) never touch a server.
Multi-page PDFs produce one image per page, ready to download.
`,
  "jpg-to-pdf": `
### Combine photos and scans into a PDF

PDF is the universal "send this as a document" format. Converting a JPG to PDF is
perfect for **receipts, scanned forms, ID photos, and portfolios** — anything you
want to look like a proper document rather than a loose image.

ZeroUpload builds the PDF locally with pdf-lib. Your image is wrapped into a
clean, single-page PDF on your device, then handed straight back to you. No
upload, no watermark, no limit.
`,
  "mp3-to-wav": `
### From compressed MP3 to lossless WAV

WAV is the uncompressed, editing-friendly format that audio software loves.
Converting MP3 to WAV won't *add back* detail the MP3 already discarded, but it
gives you a **standard, uncompressed file** that every editor and tool accepts —
ideal as an intermediate for production work.

ZeroUpload runs **ffmpeg directly in your browser** to do this. Your audio is
never uploaded. The engine downloads once from this site, then is cached.
`,
  "m4a-to-mp3": `
### Make Apple M4A audio play everywhere

M4A (AAC) sounds great and is efficient, but some older players, car stereos and
apps still prefer MP3. Converting M4A to MP3 gives you a file that plays on
**literally anything**.

ZeroUpload converts it locally with ffmpeg.wasm — your voice memos, music and
recordings never leave your device. Free, unlimited, private.
`,
};
