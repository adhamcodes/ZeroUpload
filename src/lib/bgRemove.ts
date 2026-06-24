/**
 * bgRemove.ts — 100% in-browser AI background removal.
 *
 * Library: @huggingface/transformers (Apache-2.0)
 * Model:   Xenova/modnet (Apache-2.0) — fast, lightweight portrait matting
 *          (~24 MB). Chosen for reliability: heavier general models (BiRefNet,
 *          ~200 MB) exhaust browser memory in WASM and break on Firefox WebGPU.
 *
 * THE PROMISE IS INTACT: the user's image NEVER leaves the device. Only the
 * model weights are fetched once from the Hugging Face CDN, then cached by the
 * browser. Inference runs entirely on-device on the WASM backend, which works
 * on every modern browser.
 *
 * We use the high-level `background-removal` pipeline, which handles the model's
 * input/output details internally and returns an RGBA cut-out image.
 *
 * This is a self-contained engine — it does not touch convert.ts or any of the
 * existing conversion engines.
 */

export interface BgProgress {
  stage: "download" | "warm" | "infer" | "compose";
  label: string;
  /** 0..100 when a percentage is known (model download only). */
  pct?: number;
}

export interface BgResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

/** Lightweight, web-proven portrait matting model. Apache-2.0. */
const MODEL_ID = "Xenova/modnet";

// The pipeline is loaded once and reused for every image in the tab.
let segmenterPromise: Promise<any> | null = null;

/** Turn any thrown value (Error, string, DOMException, object) into text. */
function describe(err: any): string {
  if (err == null) return "unknown error";
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  if (typeof err?.message === "string") return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function getSegmenter(onProgress?: (p: BgProgress) => void): Promise<any> {
  if (segmenterPromise) return segmenterPromise;

  segmenterPromise = (async () => {
    // Dynamic import: transformers.js is only ever pulled into the browser,
    // never at build/SSR time, and only when the user actually removes a bg.
    const tf: any = await import("@huggingface/transformers");
    const { pipeline, env } = tf;

    // We only use the remote HF model; never probe for local files.
    env.allowLocalModels = false;
    // Single-threaded WASM avoids requiring cross-origin isolation headers on
    // a static host like Cloudflare Pages.
    try {
      if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;
    } catch {
      /* non-fatal */
    }

    const progress_callback = (data: any) => {
      if (!onProgress) return;
      if (data?.status === "progress" && typeof data.progress === "number") {
        onProgress({
          stage: "download",
          label: `Downloading the AI model (one time only)… ${Math.round(data.progress)}%`,
          pct: data.progress,
        });
      } else if (data?.status === "ready" || data?.status === "done") {
        onProgress({ stage: "warm", label: "Warming up the model…" });
      }
    };

    // WASM backend: small model, runs reliably on every browser (incl. Firefox).
    return await pipeline("background-removal", MODEL_ID, {
      device: "wasm",
      dtype: "fp32",
      progress_callback,
    });
  })();

  try {
    return await segmenterPromise;
  } catch (e) {
    // Allow a later retry instead of caching a rejected promise forever.
    segmenterPromise = null;
    throw new Error(`Couldn't load the AI model — ${describe(e)}`);
  }
}

/** Encode an RGBA RawImage to a transparent PNG blob via a canvas. */
async function rawImageToPngBlob(img: any): Promise<Blob> {
  // Ensure 4 channels (RGBA) so transparency is preserved.
  const rgba = typeof img.rgba === "function" ? img.rgba() : img;
  const width: number = rgba.width;
  const height: number = rgba.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");

  const imageData = new ImageData(
    new Uint8ClampedArray(rgba.data),
    width,
    height,
  );
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode the PNG."))),
      "image/png",
    );
  });

  canvas.width = 0;
  canvas.height = 0;
  return blob;
}

/**
 * Remove the background from an image and return a transparent PNG.
 * Everything runs on-device. Throws a friendly Error on failure.
 */
export async function removeBackground(
  file: File,
  onProgress?: (p: BgProgress) => void,
): Promise<BgResult> {
  const segmenter = await getSegmenter(onProgress);

  onProgress?.({ stage: "infer", label: "Removing the background…" });

  const url = URL.createObjectURL(file);
  let outImg: any;
  try {
    const result = await segmenter(url);
    outImg = Array.isArray(result) ? result[0] : result;
  } catch (err) {
    console.error("[ZeroUpload] background removal failed:", err);
    throw new Error(`Background removal failed — ${describe(err)}`);
  } finally {
    URL.revokeObjectURL(url);
  }

  if (!outImg || !outImg.data) {
    throw new Error("The model returned no image. Please try another photo.");
  }

  onProgress?.({ stage: "compose", label: "Saving your transparent PNG…" });

  const blob = await rawImageToPngBlob(outImg);
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return {
    blob,
    filename: `${base}-no-bg.png`,
    width: outImg.width,
    height: outImg.height,
  };
}

/** Whether this browser can run the on-device model at all. */
export function backgroundRemovalSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof WebAssembly === "object"
  );
}
