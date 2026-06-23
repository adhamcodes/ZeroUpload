/**
 * preview.ts — UI-only preview generation for the file-first converter.
 *
 * This is NOT a conversion engine and does not touch any engine logic. It
 * produces a small, throwaway thumbnail so a dropped file can be SEEN before
 * and after conversion:
 *   - raster / vector images  -> object URL (the browser decodes it)
 *   - PDF                     -> first page rendered to a small PNG via pdf.js
 *   - everything else         -> null (the card shows a tasteful FormatGlyph)
 *
 * Everything stays 100% in-browser. pdf.js is loaded lazily and only when a
 * PDF preview is actually requested, so it never weighs down other pages.
 */
import { formatKind } from "../components/FormatGlyph";

let pdfjsMod: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (!pdfjsMod) {
    const lib = await import("pdfjs-dist");
    // Same worker resolution the PDF engine uses: Vite serves it same-origin.
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
      .default;
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
    pdfjsMod = lib;
  }
  return pdfjsMod;
}

/** Render the first page of a PDF to a small PNG object URL. */
async function renderPdfThumb(file: File, maxWidth = 320): Promise<string> {
  const lib = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = lib.getDocument({ data });
  const pdf = await task.promise;
  try {
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, Math.max(0.2, maxWidth / base.width));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const url = await new Promise<string>((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b ? resolve(URL.createObjectURL(b)) : reject(new Error("encode")),
        "image/png",
      );
    });

    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;
    return url;
  } finally {
    await pdf.cleanup().catch(() => {});
    try {
      await task.destroy();
    } catch {
      /* non-fatal */
    }
  }
}

/**
 * Produce a preview object URL for a file, or null when no raster preview is
 * possible (the caller then shows a FormatGlyph). The returned URL must be
 * revoked by the caller with URL.revokeObjectURL when no longer needed.
 *
 * For HEIC the object URL is still returned, but most browsers can't decode it
 * — the <img onError> handler in the card falls back to the glyph cleanly.
 */
export async function makePreviewUrl(
  file: File,
  formatId: string,
): Promise<string | null> {
  const kind = formatKind(formatId);
  if (kind === "image" || kind === "vector") {
    return URL.createObjectURL(file);
  }
  if (formatId === "pdf") {
    try {
      return await renderPdfThumb(file);
    } catch {
      return null;
    }
  }
  return null;
}

/** Whether a target format produces a raster we can show as a result thumb. */
export function isRasterFormat(formatId: string): boolean {
  return formatKind(formatId) === "image" && formatId !== "heic" && formatId !== "heif";
}
