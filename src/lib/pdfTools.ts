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
