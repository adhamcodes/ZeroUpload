/**
 * bgRemove.ts — 100% in-browser AI background removal.
 *
 * Library: @huggingface/transformers (Apache-2.0)
 * Model:   onnx-community/BiRefNet_lite-ONNX (MIT, general-purpose matting)
 *
 * THE PROMISE IS INTACT: the user's image NEVER leaves the device. Only the
 * model weights are fetched once from the Hugging Face CDN, then cached by the
 * browser. Inference runs entirely on-device via WebGPU (fast) or WASM (compat).
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

/** General-purpose matting model (people, products, logos, objects). MIT. */
const MODEL_ID = "onnx-community/BiRefNet_lite-ONNX";

// The transformers.js module + model/processor are loaded once and reused for
// every image in the session.
type Loaded = { model: any; processor: any; RawImage: any };
let modelPromise: Promise<Loaded> | null = null;

function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/** Cap the working resolution to keep memory sane (esp. on phones). */
function maxEdge(): number {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  return isMobile ? 2048 : 4096;
}

async function loadModel(onProgress?: (p: BgProgress) => void): Promise<Loaded> {
  if (modelPromise) return modelPromise;

  modelPromise = (async () => {
    // Dynamic import: transformers.js is only ever pulled into the browser,
    // never at build/SSR time, and only when the user actually removes a bg.
    const tf: any = await import("@huggingface/transformers");
    const { AutoModel, AutoProcessor, RawImage, env } = tf;

    // We only use the remote HF model; never probe for local files.
    env.allowLocalModels = false;
    // Single-threaded WASM avoids requiring cross-origin isolation headers on
    // a static host like Cloudflare Pages. (Ignored on the WebGPU path.)
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

    async function build(device: "webgpu" | "wasm", dtype: "fp16" | "fp32") {
      const model = await AutoModel.from_pretrained(MODEL_ID, {
        device,
        dtype,
        progress_callback,
      });
      const processor = await AutoProcessor.from_pretrained(MODEL_ID, {
        progress_callback,
      });
      return { model, processor, RawImage } as Loaded;
    }

    if (hasWebGPU()) {
      try {
        return await build("webgpu", "fp16");
      } catch (e) {
        // Some drivers advertise WebGPU but fail to run — fall back to WASM.
        console.warn("[ZeroUpload] WebGPU path failed, falling back to WASM:", e);
      }
    }
    return await build("wasm", "fp32");
  })();

  try {
    return await modelPromise;
  } catch (e) {
    // Allow a later retry instead of caching a rejected promise forever.
    modelPromise = null;
    throw e;
  }
}

/**
 * Remove the background from an image and return a transparent PNG.
 * Everything runs on-device. Throws a friendly Error on unsupported input.
 */
export async function removeBackground(
  file: File,
  onProgress?: (p: BgProgress) => void,
): Promise<BgResult> {
  const { model, processor, RawImage } = await loadModel(onProgress);

  onProgress?.({ stage: "infer", label: "Finding the subject…" });

  // Decode the original (capped) for full-resolution compositing.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "This image type can't be read in the browser. Try a JPG, PNG or WEBP.",
    );
  }

  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longEdge > maxEdge() ? maxEdge() / longEdge : 1;
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  // Run the model on the original via a throwaway object URL.
  const url = URL.createObjectURL(file);
  let mask: any;
  try {
    const image = await RawImage.fromURL(url);
    const { pixel_values } = await processor(image);
    const out = await model({ input_image: pixel_values });
    const outTensor = out.output_image ?? out.output ?? Object.values(out)[0];
    mask = await RawImage.fromTensor(
      outTensor[0].sigmoid().mul(255).to("uint8"),
    ).resize(w, h);
  } finally {
    URL.revokeObjectURL(url);
  }

  onProgress?.({ stage: "compose", label: "Cutting out the background…" });

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  try {
    bitmap.close();
  } catch {
    /* not all browsers implement close() */
  }

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const m: ArrayLike<number> = mask.data;
  const step = mask.channels || 1;
  const px = w * h;
  for (let p = 0; p < px; p++) {
    data[p * 4 + 3] = m[p * step];
  }
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode the PNG."))),
      "image/png",
    );
  });

  canvas.width = 0;
  canvas.height = 0;

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return { blob, filename: `${base}-no-bg.png`, width: w, height: h };
}

/** Whether this browser can run the on-device model at all. */
export function backgroundRemovalSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof createImageBitmap === "function" &&
    typeof WebAssembly === "object"
  );
}
