/**
 * ocr.ts — 100% in-browser OCR (image → text) using Tesseract.js.
 *
 * Tesseract.js runs the Tesseract OCR engine compiled to WebAssembly, entirely
 * in the browser. The engine, WASM core and language data are downloaded once
 * from a CDN and cached; after that, recognition runs fully on-device.
 *
 * THE PROMISE IS INTACT: your image is never uploaded. Only the OCR engine and
 * language files are fetched (the first time), exactly like the AI tools — and
 * your picture is read and processed locally.
 *
 * Self-contained engine. Does not touch any existing converter.
 */

import { createWorker, type Worker } from "tesseract.js";

export interface OcrProgress {
  stage: "load" | "recognize";
  label: string;
  /** 0..100 during recognition. */
  pct?: number;
}

export interface OcrResult {
  text: string;
  /** 0..100 confidence reported by the engine. */
  confidence: number;
}

let workerPromise: Promise<Worker> | null = null;
// The cached worker is created with one logger, so we route progress through a
// mutable pointer that each recognize() call swaps in.
let activeProgress: ((p: OcrProgress) => void) | null = null;

function humanizeStatus(status: string): string {
  const map: Record<string, string> = {
    "loading tesseract core": "Loading the OCR engine…",
    "initializing tesseract": "Starting the OCR engine…",
    "loading language traineddata": "Loading the language model…",
    "initializing api": "Getting ready…",
    "recognizing text": "Reading the text…",
  };
  return map[status] ?? "Preparing…";
}

async function getWorker(): Promise<Worker> {
  if (workerPromise) return workerPromise;

  workerPromise = createWorker("eng", 1, {
    logger: (m: any) => {
      if (!activeProgress) return;
      if (m?.status === "recognizing text") {
        const pct = typeof m.progress === "number" ? Math.round(m.progress * 100) : undefined;
        activeProgress({
          stage: "recognize",
          label: pct != null ? `Reading the text… ${pct}%` : "Reading the text…",
          pct,
        });
      } else if (typeof m?.status === "string") {
        activeProgress({ stage: "load", label: humanizeStatus(m.status) });
      }
    },
  }) as unknown as Promise<Worker>;

  try {
    return await workerPromise;
  } catch (e) {
    workerPromise = null;
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Couldn't load the OCR engine — ${msg}`);
  }
}

/**
 * Extract text from an image file, fully on-device.
 * Accepts JPG, PNG, WEBP, BMP, GIF (anything the browser can decode).
 */
export async function ocrImage(
  file: File | Blob,
  onProgress?: (p: OcrProgress) => void,
): Promise<OcrResult> {
  activeProgress = onProgress ?? null;
  try {
    const worker = await getWorker();
    const out: any = await worker.recognize(file);
    const data = out?.data ?? {};
    return {
      text: typeof data.text === "string" ? data.text.trim() : "",
      confidence: typeof data.confidence === "number" ? Math.round(data.confidence) : 0,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Couldn't read text from that image — ${msg}`);
  } finally {
    activeProgress = null;
  }
}

/** Whether this browser can run the on-device OCR engine. */
export function ocrSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof WebAssembly === "object"
  );
}
