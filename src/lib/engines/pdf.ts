/**
 * PDF engines — all in-browser, no upload.
 *  - pdfToImages: render PDF pages to PNG/JPG (pdf.js)
 *  - imageToPdf:  wrap an image into a single-page PDF (pdf-lib)
 */
import { convertImage } from "../convertImage";
import type { ConvertResult, ConvertOptions } from "../convert";

// pdf.js is heavy and browser-only — load it lazily and cache the module.
let pdfjs: typeof import("pdfjs-dist") | null = null;
async function getPdfjs() {
  if (!pdfjs) {
    const lib = await import("pdfjs-dist");
    // Worker URL resolved by Vite as a static asset (same-origin, $0).
    const workerUrl = (
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ).default;
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
    pdfjs = lib;
  }
  return pdfjs;
}

export async function pdfToImages(
  file: File,
  target: string,
  opts: ConvertOptions = {},
): Promise<ConvertResult[]> {
  const start = performance.now();
  const lib = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await lib.getDocument({ data }).promise;

  const scale = opts.scale ?? 2;
  const maxPages = opts.maxPages ?? pdf.numPages;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const mime = target === "png" ? "image/png" : "image/jpeg";
  const base = file.name.replace(/\.[^.]+$/, "") || "page";
  const results: ConvertResult[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a canvas for the PDF page.");

    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PDF page encode failed."))),
        mime,
        opts.quality ?? 0.92,
      );
    });

    results.push({
      blob,
      filename: `${base}-page-${i}.${target}`,
      ms: Math.max(1, Math.round(performance.now() - start)),
    });

    page.cleanup();
    // Release the canvas memory before the next page (RAM guard).
    canvas.width = 0;
    canvas.height = 0;
    opts.onProgress?.(i / pageCount, `Rendered page ${i} of ${pageCount}`);
  }

  await pdf.destroy();
  return results;
}

export async function imageToPdf(file: File): Promise<ConvertResult> {
  const start = performance.now();
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();

  const name = file.name.toLowerCase();
  const isPng = file.type === "image/png" || name.endsWith(".png");
  const isJpg = file.type === "image/jpeg" || /\.jpe?g$/.test(name);

  let embedded;
  if (isPng) {
    embedded = await pdfDoc.embedPng(new Uint8Array(await file.arrayBuffer()));
  } else if (isJpg) {
    embedded = await pdfDoc.embedJpg(new Uint8Array(await file.arrayBuffer()));
  } else {
    // Any other raster (e.g. WEBP): rasterise to PNG first, then embed.
    const png = await convertImage(file, "png");
    embedded = await pdfDoc.embedPng(new Uint8Array(await png.blob.arrayBuffer()));
  }

  const page = pdfDoc.addPage([embedded.width, embedded.height]);
  page.drawImage(embedded, {
    x: 0,
    y: 0,
    width: embedded.width,
    height: embedded.height,
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const base = file.name.replace(/\.[^.]+$/, "") || "document";
  return {
    blob,
    filename: `${base}.pdf`,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}
