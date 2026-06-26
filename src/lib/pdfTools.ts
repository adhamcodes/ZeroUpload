/**
 * pdfTools.ts — in-browser PDF tools (merge, split).
 *
 * Uses pdf-lib (already a dependency), runs 100% on the user's device.
 * No upload, no server. Same promise as the rest of ZeroUpload.
 */

export interface PdfToolResult {
  blob: Blob;
  filename: string;
  pages?: number;
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "document";
}

/** Number of pages in a PDF (used to drive the split UI). */
export async function getPdfPageCount(file: File): Promise<number> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(await file.arrayBuffer());
  return doc.getPageCount();
}

/** Merge several PDFs (in the given order) into a single PDF. */
export async function mergePdfs(files: File[]): Promise<PdfToolResult> {
  if (files.length < 2) {
    throw new Error("Add at least two PDFs to merge.");
  }
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();

  for (const file of files) {
    let src;
    try {
      src = await PDFDocument.load(await file.arrayBuffer());
    } catch {
      throw new Error(`"${file.name}" couldn't be read — is it a valid PDF?`);
    }
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((p) => out.addPage(p));
  }

  const bytes = await out.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    filename: "merged.pdf",
    pages: out.getPageCount(),
  };
}

/** Extract an inclusive 1-based page range into a new PDF. */
export async function extractRange(
  file: File,
  fromPage: number,
  toPage: number,
): Promise<PdfToolResult> {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(await file.arrayBuffer());
  const total = src.getPageCount();

  const start = Math.max(1, Math.min(fromPage, toPage));
  const end = Math.min(total, Math.max(fromPage, toPage));
  if (start > total) throw new Error(`This PDF only has ${total} page(s).`);

  const out = await PDFDocument.create();
  const indices: number[] = [];
  for (let i = start - 1; i <= end - 1; i++) indices.push(i);
  const copied = await out.copyPages(src, indices);
  copied.forEach((p) => out.addPage(p));

  const bytes = await out.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-p${start}-${end}.pdf`,
    pages: out.getPageCount(),
  };
}

/** Split a PDF into one new PDF per page. */
export async function splitToPages(file: File): Promise<PdfToolResult[]> {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(await file.arrayBuffer());
  const total = src.getPageCount();
  const base = baseName(file.name);
  const results: PdfToolResult[] = [];

  for (let i = 0; i < total; i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    const bytes = await doc.save();
    results.push({
      blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
      filename: `${base}-page-${i + 1}.pdf`,
      pages: 1,
    });
  }
  return results;
}


// ---- PDF text extraction (pdf.js) ----
let pdfjsMod: typeof import("pdfjs-dist") | null = null;
async function getPdfjs() {
  if (!pdfjsMod) {
    const lib = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
      .default;
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
    pdfjsMod = lib;
  }
  return pdfjsMod;
}

export interface PdfText {
  text: string;
  pages: number;
  /** true if the PDF appears to have no extractable text (e.g. a scan) */
  empty: boolean;
}

/** Extract the text content of a PDF, page by page. */
export async function extractText(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<PdfText> {
  const lib = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = lib.getDocument({ data });
  const pdf = await task.promise;
  const pages = pdf.numPages;
  const parts: string[] = [];

  try {
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const line = content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" ")
        .replace(/[ \t]+/g, " ")
        .trim();
      parts.push(line);
      page.cleanup();
      onProgress?.(i / pages);
    }
  } finally {
    await pdf.cleanup().catch(() => {});
    try {
      await task.destroy();
    } catch {
      /* non-fatal */
    }
  }

  const text = parts.join("\n\n").trim();
  return { text, pages, empty: text.length === 0 };
}


/** Rotate every page of a PDF by 90/180/270 degrees (clockwise). Lossless. */
export async function rotatePdf(
  file: File,
  turn: 90 | 180 | 270,
): Promise<PdfToolResult> {
  const { PDFDocument, degrees } = await import("pdf-lib");
  const doc = await PDFDocument.load(await file.arrayBuffer());
  for (const page of doc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + turn) % 360));
  }
  const bytes = await doc.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-rotated.pdf`,
    pages: doc.getPageCount(),
  };
}


/**
 * "Light" PDF compression: render each page to a JPEG (at a quality/scale you
 * choose) and rebuild the PDF from those images. Real size savings for scanned
 * or image-heavy PDFs — but the pages become flat images, so the text is no
 * longer selectable/searchable. We label this clearly in the UI.
 */
export async function compressPdf(
  file: File,
  opts: { quality: number; scale: number; onProgress?: (r: number) => void },
): Promise<PdfToolResult> {
  const lib = await getPdfjs();
  const { PDFDocument } = await import("pdf-lib");
  const data = new Uint8Array(await file.arrayBuffer());
  const task = lib.getDocument({ data });
  const pdf = await task.promise;
  const out = await PDFDocument.create();
  const n = pdf.numPages;

  try {
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: opts.scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create a canvas for the PDF page.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Page encode failed."))),
          "image/jpeg",
          opts.quality,
        );
      });
      const jpg = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      const p = out.addPage([jpg.width, jpg.height]);
      p.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height });

      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
      opts.onProgress?.(i / n);
    }
  } finally {
    await pdf.cleanup().catch(() => {});
    try {
      await task.destroy();
    } catch {
      /* non-fatal */
    }
  }

  const bytes = await out.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-compressed.pdf`,
    pages: n,
  };
}



/**
 * Render small thumbnails for every page of a PDF (for the reorder UI).
 * Returns a data URL per page, in page order. Runs on-device via pdf.js.
 */
export async function renderPdfThumbnails(
  file: File,
  opts: { scale?: number; onProgress?: (r: number) => void } = {},
): Promise<string[]> {
  const scale = opts.scale ?? 0.35;
  const lib = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = lib.getDocument({ data });
  const pdf = await task.promise;
  const n = pdf.numPages;
  const thumbs: string[] = [];

  try {
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create a canvas for the PDF page.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      thumbs.push(canvas.toDataURL("image/jpeg", 0.7));
      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
      opts.onProgress?.(i / n);
    }
  } finally {
    await pdf.cleanup().catch(() => {});
    try {
      await task.destroy();
    } catch {
      /* non-fatal */
    }
  }
  return thumbs;
}

/**
 * Rebuild a PDF using the given page order (0-based indices). Pages omitted
 * from `order` are dropped, so this powers both reordering and deleting.
 * Lossless — pages are copied, never re-compressed.
 */
export async function reorderPdf(
  file: File,
  order: number[],
): Promise<PdfToolResult> {
  if (order.length === 0) {
    throw new Error("Keep at least one page.");
  }
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(await file.arrayBuffer());
  const total = src.getPageCount();
  const safe = order.filter((i) => Number.isInteger(i) && i >= 0 && i < total);
  if (safe.length === 0) throw new Error("No valid pages to keep.");

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, safe);
  copied.forEach((p) => out.addPage(p));

  const bytes = await out.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-reordered.pdf`,
    pages: out.getPageCount(),
  };
}
