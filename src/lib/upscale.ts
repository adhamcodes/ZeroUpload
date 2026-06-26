/**
 * upscale.ts — 100% in-browser AI image upscaling / restoration.
 *
 * Library: @huggingface/transformers (Apache-2.0) — the same engine that powers
 *          the background remover, so we reuse a proven loading path.
 * Model:   Xenova/4x_APISR_GRL_GAN_generator-onnx — a GAN-based 4x super-
 *          resolution + restoration model (~6.5 MB ONNX). It deblurs, removes
 *          JPEG artifacts, and reconstructs detail. Best on small/low-res or
 *          slightly blurry images; it is NOT magic on heavily destroyed photos.
 *
 * THE PROMISE IS INTACT: the user's image NEVER leaves the device. Only the
 * model weights are fetched once from the Hugging Face CDN (then browser-cached).
 * Inference runs entirely on-device on the WASM backend, which works on every
 * modern browser (including Firefox). The model is served from the CDN at
 * runtime and is never bundled or redistributed by ZeroUpload.
 *
 * Self-contained engine — it does not touch convert.ts or any existing engine.
 */

export interface UpscaleProgress {
  stage: "download" | "warm" | "prepare" | "infer" | "compose";
  label: string;
  /** 0..100 when a percentage is known (model download only). */
  pct?: number;
}

export interface UpscaleResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  inputWidth: number;
  inputHeight: number;
  /** True when we shrank the input first to keep things fast/stable. */
  inputWasCapped: boolean;
}

/** The model upscales by a fixed factor of 4x. */
export const SCALE_FACTOR = 4;

const MODEL_ID = "Xenova/4x_APISR_GRL_GAN_generator-onnx";

/**
 * Largest input edge we feed the model, in pixels. Output is 4x this, so 1024
 * input -> 4096 output (~16 MP). We drop to 768 on memory-constrained devices
 * to avoid out-of-memory crashes on phones. Anything bigger is downscaled first
 * (an already-large image does not need AI upscaling anyway).
 */
function inputCap(): number {
  try {
    // navigator.deviceMemory is in GB (Chromium-only); absent elsewhere.
    const mem = (navigator as any)?.deviceMemory;
    if (typeof mem === "number" && mem > 0 && mem <= 4) return 768;
  } catch {
    /* ignore */
  }
  return 1024;
}

const MAX_FILE_BYTES = 30 * 1024 * 1024;

let pipePromise: Promise<any> | null = null;

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

async function getUpscaler(onProgress?: (p: UpscaleProgress) => void): Promise<any> {
  if (pipePromise) return pipePromise;

  pipePromise = (async () => {
    const tf: any = await import("@huggingface/transformers");
    const { pipeline, env } = tf;

    env.allowLocalModels = false;
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

    // WASM + fp32: maximum compatibility across browsers (matches bg remover).
    return await pipeline("image-to-image", MODEL_ID, {
      device: "wasm",
      dtype: "fp32",
      progress_callback,
    });
  })();

  try {
    return await pipePromise;
  } catch (e) {
    pipePromise = null;
    throw new Error(`Couldn't load the AI model — ${describe(e)}`);
  }
}

interface PreparedInput {
  blobUrl: string;
  width: number;
  height: number;
  capped: boolean;
}

/** Decode the file, downscale to the device cap if needed, return a blob URL. */
async function prepareInput(file: File): Promise<PreparedInput> {
  const srcUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image."));
      el.src = srcUrl;
    });
  } catch (e) {
    URL.revokeObjectURL(srcUrl);
    throw e;
  }

  const ow = img.naturalWidth;
  const oh = img.naturalHeight;
  if (!ow || !oh) {
    URL.revokeObjectURL(srcUrl);
    throw new Error("That image appears to be empty or corrupt.");
  }

  const cap = inputCap();
  const longest = Math.max(ow, oh);

  // Small enough already — feed the original file straight through.
  if (longest <= cap) {
    return { blobUrl: srcUrl, width: ow, height: oh, capped: false };
  }

  // Too big — downscale first so the 4x output stays within memory limits.
  const ratio = cap / longest;
  const tw = Math.max(1, Math.round(ow * ratio));
  const th = Math.max(1, Math.round(oh * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(srcUrl);
    throw new Error("Canvas isn't available in this browser.");
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, tw, th);
  URL.revokeObjectURL(srcUrl);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not prepare the image."))),
      "image/png",
    );
  });
  canvas.width = 0;
  canvas.height = 0;
  return { blobUrl: URL.createObjectURL(blob), width: tw, height: th, capped: true };
}

/** Convert a transformers.js RawImage (RGB or RGBA) to a PNG blob via canvas. */
async function rawImageToPngBlob(img: any): Promise<Blob> {
  const width: number = img.width;
  const height: number = img.height;
  const channels: number = img.channels ?? 3;
  const src: Uint8Array = img.data;

  const rgba = new Uint8ClampedArray(width * height * 4);
  if (channels === 4) {
    rgba.set(src);
  } else if (channels === 3) {
    for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
      rgba[j] = src[i];
      rgba[j + 1] = src[i + 1];
      rgba[j + 2] = src[i + 2];
      rgba[j + 3] = 255;
    }
  } else if (channels === 1) {
    for (let i = 0, j = 0; i < src.length; i += 1, j += 4) {
      rgba[j] = rgba[j + 1] = rgba[j + 2] = src[i];
      rgba[j + 3] = 255;
    }
  } else {
    throw new Error(`Unexpected image format (${channels} channels).`);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);

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
 * Upscale / restore an image 4x, fully on-device. Returns a PNG.
 * Throws a friendly Error on failure.
 */
export async function upscaleImage(
  file: File,
  onProgress?: (p: UpscaleProgress) => void,
): Promise<UpscaleResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `That image is ${(file.size / (1024 * 1024)).toFixed(1)} MB — please use one under 30 MB.`,
    );
  }

  const upscaler = await getUpscaler(onProgress);

  onProgress?.({ stage: "prepare", label: "Preparing your image…" });
  const input = await prepareInput(file);

  onProgress?.({
    stage: "infer",
    label: "Enhancing on your device — this can take a moment…",
  });

  let outImg: any;
  try {
    const result = await upscaler(input.blobUrl);
    outImg = Array.isArray(result) ? result[0] : result;
  } catch (err) {
    console.error("[ZeroUpload] upscale failed:", err);
    throw new Error(
      `Enhancing failed — ${describe(err)}. The image may be too large or complex for this device.`,
    );
  } finally {
    URL.revokeObjectURL(input.blobUrl);
  }

  if (!outImg || !outImg.data) {
    throw new Error("The model returned no image. Please try another photo.");
  }

  onProgress?.({ stage: "compose", label: "Saving your enhanced image…" });
  const blob = await rawImageToPngBlob(outImg);
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return {
    blob,
    filename: `${base}-enhanced.png`,
    width: outImg.width,
    height: outImg.height,
    inputWidth: input.width,
    inputHeight: input.height,
    inputWasCapped: input.capped,
  };
}

/** Whether this browser can run the on-device model at all. */
export function upscaleSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof WebAssembly === "object"
  );
}
