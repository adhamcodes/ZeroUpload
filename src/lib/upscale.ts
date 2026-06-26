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
 * MEMORY: this is a transformer model, so its working memory grows fast with
 * input size — a large input upscaled 4x can exhaust the browser's WASM heap
 * (std::bad_alloc). We therefore (a) start from a conservative input size, and
 * (b) if a run runs out of memory, automatically retry at a smaller size until
 * it succeeds. The result may be smaller on a low-memory device, but it will
 * not hard-crash.
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
  stage: "download" | "warm" | "prepare" | "infer" | "retry" | "compose";
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
 * Starting input cap (longest edge, in pixels). The model output is 4x this,
 * so 512 in -> 2048 out. These are intentionally conservative: a transformer
 * SR model needs a lot of scratch memory, and overshooting throws bad_alloc.
 * We step down from here automatically if a run runs out of memory.
 */
function startingCap(): number {
  try {
    // navigator.deviceMemory is in GB (Chromium-only); absent elsewhere.
    const mem = (navigator as any)?.deviceMemory;
    if (typeof mem === "number" && mem > 0 && mem <= 4) return 320;
  } catch {
    /* ignore */
  }
  return 512;
}

/** Smallest input edge we will fall back to before giving up. */
const MIN_EDGE = 160;

/**
 * Build a descending list of input edge sizes to attempt, starting at the
 * smaller of the device cap and the image's own longest edge.
 */
function candidateEdges(longest: number): number[] {
  const start = Math.min(startingCap(), Math.max(MIN_EDGE, Math.round(longest)));
  const edges: number[] = [];
  let e = start;
  while (e >= MIN_EDGE) {
    const rounded = Math.round(e);
    if (edges[edges.length - 1] !== rounded) edges.push(rounded);
    e = e * 0.7;
  }
  if (edges[edges.length - 1] !== MIN_EDGE && start > MIN_EDGE) edges.push(MIN_EDGE);
  return edges;
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

/** Does this error look like an out-of-memory failure we can retry smaller? */
function isMemoryError(err: any): boolean {
  const s = describe(err).toLowerCase();
  return (
    s.includes("bad_alloc") ||
    s.includes("alloc") ||
    s.includes("out of memory") ||
    s.includes("oom") ||
    s.includes("memory") ||
    // ORT surfaces allocation failures from OrtRun with error code 6.
    s.includes("ortrun")
  );
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

interface DecodedImage {
  img: HTMLImageElement;
  srcUrl: string;
  width: number;
  height: number;
}

/** Decode the file into an <img> we can re-sample at different sizes. */
async function decodeImage(file: File): Promise<DecodedImage> {
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
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  if (!width || !height) {
    URL.revokeObjectURL(srcUrl);
    throw new Error("That image appears to be empty or corrupt.");
  }
  return { img, srcUrl, width, height };
}

interface ScaledInput {
  blobUrl: string;
  width: number;
  height: number;
  scaled: boolean;
}

/** Produce a blob URL of the image resized so its longest edge ≤ targetEdge. */
async function scaleTo(dec: DecodedImage, targetEdge: number): Promise<ScaledInput> {
  const longest = Math.max(dec.width, dec.height);
  const ratio = Math.min(1, targetEdge / longest);
  const scaled = ratio < 1;
  const tw = Math.max(1, Math.round(dec.width * ratio));
  const th = Math.max(1, Math.round(dec.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(dec.img, 0, 0, tw, th);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not prepare the image."))),
      "image/png",
    );
  });
  canvas.width = 0;
  canvas.height = 0;
  return { blobUrl: URL.createObjectURL(blob), width: tw, height: th, scaled };
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
 *
 * Tries progressively smaller input sizes if the device runs out of memory, so
 * it degrades gracefully instead of crashing. Throws a friendly Error only if
 * even the smallest size fails.
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
  const dec = await decodeImage(file);
  const edges = candidateEdges(Math.max(dec.width, dec.height));

  let lastErr: any = null;
  try {
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      let scaledInput: ScaledInput | null = null;
      try {
        scaledInput = await scaleTo(dec, edge);
        onProgress?.({
          stage: i === 0 ? "infer" : "retry",
          label:
            i === 0
              ? "Enhancing on your device — this can take a moment…"
              : "Your device ran low on memory — retrying at a smaller size…",
        });

        const result = await upscaler(scaledInput.blobUrl);
        const outImg = Array.isArray(result) ? result[0] : result;
        URL.revokeObjectURL(scaledInput.blobUrl);
        scaledInput = null;

        if (!outImg || !outImg.data) {
          throw new Error("The model returned no image.");
        }

        onProgress?.({ stage: "compose", label: "Saving your enhanced image…" });
        const blob = await rawImageToPngBlob(outImg);
        const base = file.name.replace(/\.[^.]+$/, "") || "image";
        const wasCapped = edges[i] < Math.max(dec.width, dec.height);
        return {
          blob,
          filename: `${base}-enhanced.png`,
          width: outImg.width,
          height: outImg.height,
          inputWidth: outImg.width ? Math.round(outImg.width / SCALE_FACTOR) : edge,
          inputHeight: outImg.height ? Math.round(outImg.height / SCALE_FACTOR) : edge,
          inputWasCapped: wasCapped,
        };
      } catch (err) {
        if (scaledInput) URL.revokeObjectURL(scaledInput.blobUrl);
        lastErr = err;
        console.warn(`[ZeroUpload] upscale attempt at ${edge}px failed:`, err);
        // Memory error → keep stepping down. Other errors on the very first
        // attempt are likely fatal (bad model/output), so stop early.
        if (!isMemoryError(err) && i === 0) break;
      }
    }
  } finally {
    URL.revokeObjectURL(dec.srcUrl);
  }

  if (isMemoryError(lastErr)) {
    throw new Error(
      "This image needs more memory than this device has — even after shrinking it. " +
        "Try a smaller image, close other tabs, or use a desktop browser.",
    );
  }
  throw new Error(
    `Enhancing failed — ${describe(lastErr)}. Please try another image.`,
  );
}

/** Whether this browser can run the on-device model at all. */
export function upscaleSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof WebAssembly === "object"
  );
}
