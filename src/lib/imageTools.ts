/**
 * imageTools.ts — in-browser image tools (compress, and resize later).
 *
 * Canvas-based, runs 100% on the user's device. No upload, no server, no
 * network. Same promise as the rest of ZeroUpload.
 */

export type CompressFormat = "auto" | "jpg" | "webp" | "png";

export interface CompressOptions {
  /** output format; "auto" keeps a sensible type based on the source */
  format: CompressFormat;
  /** lossy quality 0..1 (ignored for png) */
  quality: number;
  /** optional: cap the longest edge in px (downscale only, never upscale) */
  maxEdge?: number;
}

export interface ImageToolResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  ms: number;
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  png: "image/png",
};

/** Load a raster image file into a drawable bitmap (with an <img> fallback). */
async function loadBitmap(
  file: File,
): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not read this image file."));
        img.src = url;
      });
      return img;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
}

function dimensionsOf(b: ImageBitmap | HTMLImageElement): {
  width: number;
  height: number;
} {
  if ("naturalWidth" in b) {
    return {
      width: b.naturalWidth || b.width || 1024,
      height: b.naturalHeight || b.height || 1024,
    };
  }
  return { width: b.width, height: b.height };
}

function resolveOutput(
  file: File,
  format: CompressFormat,
): { mime: string; ext: string } {
  if (format !== "auto") {
    return { mime: MIME[format], ext: format === "jpeg" ? "jpg" : format };
  }
  // Auto: keep a sensible type based on the source.
  const t = file.type;
  if (t === "image/webp") return { mime: "image/webp", ext: "webp" };
  if (t === "image/png") return { mime: "image/png", ext: "png" };
  // Everything else compresses best as JPEG.
  return { mime: "image/jpeg", ext: "jpg" };
}

/**
 * Compress (and optionally downscale) a single image, entirely client-side.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions,
): Promise<ImageToolResult> {
  const start = performance.now();
  const { mime, ext } = resolveOutput(file, opts.format);

  const bitmap = await loadBitmap(file);
  let { width, height } = dimensionsOf(bitmap);

  if (opts.maxEdge && Math.max(width, height) > opts.maxEdge) {
    const scale = opts.maxEdge / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not create a drawing canvas.");

  // JPEG has no alpha — paint white so transparent areas don't go black.
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode the image."))),
      mime,
      // PNG ignores quality; harmless to pass.
      opts.quality,
    );
  });

  canvas.width = 0;
  canvas.height = 0;

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return {
    blob,
    filename: `${base}-min.${ext}`,
    width,
    height,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}
