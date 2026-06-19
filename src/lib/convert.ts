/**
 * Engine dispatcher. Routes a conversion to the correct in-browser engine.
 *
 * EVERY engine runs 100% on the user's device. Heavy engines (HEIC, PDF,
 * audio) are loaded with dynamic import() so their WASM/JS payload is only
 * downloaded when a user actually needs them — keeping the rest of the site
 * instant. Nothing is ever uploaded.
 */
import { convertImage, type ConvertResult } from "./convertImage";

export type { ConvertResult };

export type EngineId = "image" | "heic" | "pdf2img" | "img2pdf" | "audio";

export interface ConvertOptions {
  /** lossy quality 0..1 */
  quality?: number;
  /** pdf2img: cap pages rendered (mobile RAM guard) */
  maxPages?: number;
  /** pdf2img: render scale */
  scale?: number;
  /** progress callback for heavy engines (0..1 or -1 for indeterminate) */
  onProgress?: (ratio: number, label: string) => void;
  /** persistent, user-facing notice (e.g. mobile page-cap on big PDFs) */
  onInfo?: (message: string) => void;
}

/** Returns one or more output files (PDF->images yields one per page). */
export async function convertFile(
  file: File,
  engine: EngineId,
  target: string,
  opts: ConvertOptions = {},
): Promise<ConvertResult[]> {
  switch (engine) {
    case "image":
      return [await convertImage(file, target, opts.quality)];
    case "heic": {
      const { convertHeic } = await import("./engines/heic");
      return [await convertHeic(file, target, opts)];
    }
    case "pdf2img": {
      const { pdfToImages } = await import("./engines/pdf");
      return pdfToImages(file, target, opts);
    }
    case "img2pdf": {
      const { imageToPdf } = await import("./engines/pdf");
      return [await imageToPdf(file)];
    }
    case "audio": {
      const { convertAudio } = await import("./engines/audio");
      return [await convertAudio(file, target, opts)];
    }
    default:
      throw new Error(`Unknown engine: ${engine}`);
  }
}

/** Whether an engine downloads a large payload on first use (UI hint). */
export function engineIsHeavy(engine: EngineId): boolean {
  return engine === "audio";
}
