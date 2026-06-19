/**
 * The in-browser image conversion engine.
 *
 * Runs ENTIRELY on the user's device using the Canvas API — no upload,
 * no server, no network. This is the "ZeroUpload" promise in code.
 *
 * Designed as a small registry so additional engines (HEIC via libheif,
 * PDF via pdf.js/pdf-lib, audio via ffmpeg.wasm) plug in later behind the
 * same `convert()` signature.
 */

export interface ConvertResult {
  blob: Blob;
  filename: string;
  /** ms taken, for the satisfying "done in Xms" flourish */
  ms: number;
}

const MIME_BY_TARGET: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** Load any supported source file into a drawable bitmap. */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  const isSvg =
    file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

  if (isSvg) {
    // SVG must go through an <img> element so the browser rasterises it.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not read the SVG file."));
        img.src = url;
      });
      return img;
    } finally {
      // Revoke after the image has loaded into memory.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }

  // Fast path for raster formats (PNG/JPG/JPEG/WEBP/GIF/BMP).
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback via <img> for browsers/formats that reject createImageBitmap.
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

function dimensionsOf(
  bitmap: ImageBitmap | HTMLImageElement,
): { width: number; height: number } {
  if ("naturalWidth" in bitmap) {
    return {
      width: bitmap.naturalWidth || bitmap.width || 1024,
      height: bitmap.naturalHeight || bitmap.height || 1024,
    };
  }
  return { width: bitmap.width, height: bitmap.height };
}

/**
 * Convert a single image file to the target format, entirely client-side.
 * @param file   the user's source file
 * @param target target format id, e.g. "jpg" | "png" | "webp"
 * @param quality 0..1 for lossy formats (jpg/webp)
 */
export async function convertImage(
  file: File,
  target: string,
  quality = 0.92,
): Promise<ConvertResult> {
  const start = performance.now();
  const mime = MIME_BY_TARGET[target];
  if (!mime) {
    throw new Error(`Unsupported target format: ${target}`);
  }

  const bitmap = await loadBitmap(file);
  const { width, height } = dimensionsOf(bitmap);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not create a drawing canvas.");

  // For formats without an alpha channel (JPEG), paint a white background
  // so transparent areas don't turn black.
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Conversion failed while encoding the image."));
      },
      mime,
      quality,
    );
  });

  // Release the canvas memory deterministically (matters for back-to-back
  // batches of large images).
  canvas.width = 0;
  canvas.height = 0;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "converted";
  const ext = target === "jpeg" ? "jpeg" : target;

  return {
    blob,
    filename: `${baseName}.${ext}`,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}
