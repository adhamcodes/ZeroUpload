/**
 * HEIC engine — decodes Apple HEIC/HEIF photos to JPG/PNG/WEBP, in-browser.
 * Powered by libheif (via the `heic-to` package). No upload.
 */
import type { ConvertResult, ConvertOptions } from "../convert";

const MIME: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function convertHeic(
  file: File,
  target: string,
  opts: ConvertOptions = {},
): Promise<ConvertResult> {
  const start = performance.now();
  const { heicTo } = await import("heic-to");
  const type = MIME[target] ?? "image/jpeg";

  const blob = await heicTo({
    blob: file,
    type,
    quality: opts.quality ?? 0.92,
  });

  const base = file.name.replace(/\.[^.]+$/, "") || "converted";
  const ext = target === "jpeg" ? "jpeg" : target;
  return {
    blob,
    filename: `${base}.${ext}`,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}
