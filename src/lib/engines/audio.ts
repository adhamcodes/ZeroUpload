/**
 * Audio engine — converts between MP3/WAV/OGG/M4A/FLAC/AAC fully in-browser
 * via ffmpeg.wasm (single-threaded core, self-hosted from /ffmpeg so it works
 * same-origin with no SharedArrayBuffer / cross-origin-isolation headers).
 *
 * The ~32MB core is downloaded from our OWN origin on first audio use, cached
 * by the browser thereafter. Audio files are small, so a single decode never
 * threatens tab memory. No upload, ever.
 */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import type { ConvertResult, ConvertOptions } from "../convert";

const MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  aac: "audio/aac",
};

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;
const recentLog: string[] = [];

/**
 * Reassemble the split ffmpeg-core.wasm from its same-origin parts into a
 * single blob URL. Parts are < 25 MiB each (Cloudflare Pages limit) and are
 * concatenated back into the exact original bytes — entirely in the browser.
 */
async function assembleWasmUrl(
  base: string,
  onProgress?: (ratio: number, label: string) => void,
): Promise<string> {
  const manifest: { parts: string[] } = await fetch(
    `${base}/ffmpeg-core.wasm.manifest.json`,
  ).then((r) => {
    if (!r.ok) throw new Error("Could not load the audio engine manifest.");
    return r.json();
  });

  const buffers: ArrayBuffer[] = [];
  for (let i = 0; i < manifest.parts.length; i++) {
    onProgress?.(
      -1,
      `Loading audio engine (${i + 1}/${manifest.parts.length})…`,
    );
    const res = await fetch(`${base}/${manifest.parts[i]}`);
    if (!res.ok) throw new Error("Could not load the audio engine.");
    buffers.push(await res.arrayBuffer());
  }

  const blob = new Blob(buffers, { type: "application/wasm" });
  return URL.createObjectURL(blob);
}

async function getFFmpeg(
  onProgress?: (ratio: number, label: string) => void,
): Promise<FFmpeg> {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => {
      recentLog.push(message);
      if (recentLog.length > 15) recentLog.shift();
    });
  }
  const ff = ffmpeg;
  if (!loadPromise) {
    const base = "/ffmpeg";
    onProgress?.(-1, "Loading audio engine (first use only)…");
    loadPromise = (async () => {
      try {
        // ESM core, served same-origin. The Vite-bundled worker is a module
        // worker, so it loads the core via `import(coreURL).default` — which
        // requires the ESM build (the UMD build has no default export).
        // Passing the direct URL (not a blob) lets that import resolve cleanly.
        const coreURL = `${base}/ffmpeg-core.js`;
        const wasmURL = await assembleWasmUrl(base, onProgress);
        await ff.load({ coreURL, wasmURL });
        // The wasm is now compiled into the module; free the ~30MB blob URL.
        URL.revokeObjectURL(wasmURL);
      } catch (err) {
        // Reset so the user can retry instead of caching a rejected load.
        loadPromise = null;
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(`Could not start the audio engine. ${detail}`.trim());
      }
    })();
  }
  await loadPromise;
  return ff;
}

export async function convertAudio(
  file: File,
  target: string,
  opts: ConvertOptions = {},
): Promise<ConvertResult> {
  const start = performance.now();
  const ff = await getFFmpeg(opts.onProgress);

  const stamp = Date.now();
  const inExt = (file.name.split(".").pop() || "dat").toLowerCase();
  const input = `in_${stamp}.${inExt}`;
  const output = `out_${stamp}.${target}`;

  await ff.writeFile(input, await fetchFile(file));

  recentLog.length = 0;
  const code = await ff.exec(["-i", input, output]);

  let data: Uint8Array | string;
  try {
    data = await ff.readFile(output);
  } catch {
    const tail = recentLog.slice(-6).join(" | ");
    await ff.deleteFile(input).catch(() => {});
    throw new Error(
      `Audio conversion failed (ffmpeg exit ${code}). ${tail || "No output produced."}`,
    );
  }

  await ff.deleteFile(input).catch(() => {});
  await ff.deleteFile(output).catch(() => {});

  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const blob = new Blob([bytes as BlobPart], {
    type: MIME[target] ?? "application/octet-stream",
  });
  const base = file.name.replace(/\.[^.]+$/, "") || "audio";
  return {
    blob,
    filename: `${base}.${target}`,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}



/* ------------------------------------------------------------------ *
 * Audio editing tools (trim / merge / compress) — same ffmpeg.wasm
 * instance, same on-device promise. Self-contained additions; they do
 * not modify convertAudio above.
 * ------------------------------------------------------------------ */

export interface AudioToolResult {
  blob: Blob;
  filename: string;
  ms: number;
}

type AudioProgress = (ratio: number, label: string) => void;

function audioExt(file: File): string {
  return (file.name.split(".").pop() || "dat").toLowerCase();
}

function audioBase(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "audio";
}

/** Read metadata duration (seconds) with a plain <audio> element — no ffmpeg. */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const d = el.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : 0);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read this audio file's length."));
    };
    el.src = url;
  });
}

/** Shared output reader with friendly error + cleanup. */
async function finishExec(
  ff: FFmpeg,
  output: string,
  cleanup: string[],
  code: number,
  what: string,
): Promise<Uint8Array> {
  let data: Uint8Array | string;
  try {
    data = await ff.readFile(output);
  } catch {
    const tail = recentLog.slice(-6).join(" | ");
    for (const f of cleanup) await ff.deleteFile(f).catch(() => {});
    throw new Error(`${what} failed (ffmpeg exit ${code}). ${tail || "No output produced."}`);
  }
  for (const f of cleanup) await ff.deleteFile(f).catch(() => {});
  await ff.deleteFile(output).catch(() => {});
  return typeof data === "string" ? new TextEncoder().encode(data) : data;
}

/**
 * Trim/cut a section out of an audio file. Lossless — copies the stream
 * without re-encoding, so quality is identical and it's fast. Keeps the
 * original format.
 */
export async function trimAudio(
  file: File,
  startSec: number,
  endSec: number,
  onProgress?: AudioProgress,
): Promise<AudioToolResult> {
  const start = performance.now();
  const ff = await getFFmpeg(onProgress);
  const stamp = Date.now();
  const ext = audioExt(file);
  const input = `trim_in_${stamp}.${ext}`;
  const output = `trim_out_${stamp}.${ext}`;

  const from = Math.max(0, startSec);
  const dur = Math.max(0.05, endSec - from);

  await ff.writeFile(input, await fetchFile(file));
  recentLog.length = 0;
  onProgress?.(-1, "Trimming…");
  // -ss before -i = fast seek; -c copy = lossless stream copy.
  const code = await ff.exec([
    "-ss", String(from),
    "-i", input,
    "-t", String(dur),
    "-c", "copy",
    output,
  ]);

  const bytes = await finishExec(ff, output, [input], code, "Trim");
  const blob = new Blob([bytes as BlobPart], {
    type: MIME[ext] ?? "application/octet-stream",
  });
  return {
    blob,
    filename: `${audioBase(file.name)}-trimmed.${ext}`,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}

/**
 * Merge several audio files into one, in order. Uses the concat filter so it
 * works even when the inputs have different codecs/sample rates — which means
 * the result is re-encoded to the chosen format (lossy for mp3/aac).
 */
export async function mergeAudio(
  files: File[],
  target: string,
  onProgress?: AudioProgress,
): Promise<AudioToolResult> {
  if (files.length < 2) throw new Error("Add at least two audio files to merge.");
  const start = performance.now();
  const ff = await getFFmpeg(onProgress);
  const stamp = Date.now();

  const inputs: string[] = [];
  const args: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const name = `merge_${stamp}_${i}.${audioExt(files[i])}`;
    await ff.writeFile(name, await fetchFile(files[i]));
    inputs.push(name);
    args.push("-i", name);
  }

  const filter =
    files.map((_, i) => `[${i}:a]`).join("") +
    `concat=n=${files.length}:v=0:a=1[out]`;
  const output = `merged_${stamp}.${target}`;
  args.push("-filter_complex", filter, "-map", "[out]", output);

  recentLog.length = 0;
  onProgress?.(-1, "Merging…");
  const code = await ff.exec(args);

  const bytes = await finishExec(ff, output, inputs, code, "Merge");
  const blob = new Blob([bytes as BlobPart], {
    type: MIME[target] ?? "application/octet-stream",
  });
  return {
    blob,
    filename: `merged-audio.${target}`,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}

/**
 * Compress audio by re-encoding to MP3 at a target bitrate. This is lossy —
 * smaller file, slightly lower fidelity — so the UI says so plainly.
 */
export async function compressAudio(
  file: File,
  bitrateKbps: number,
  onProgress?: AudioProgress,
): Promise<AudioToolResult> {
  const start = performance.now();
  const ff = await getFFmpeg(onProgress);
  const stamp = Date.now();
  const input = `comp_in_${stamp}.${audioExt(file)}`;
  const output = `comp_out_${stamp}.mp3`;

  await ff.writeFile(input, await fetchFile(file));
  recentLog.length = 0;
  onProgress?.(-1, "Compressing…");
  const code = await ff.exec([
    "-i", input,
    "-b:a", `${bitrateKbps}k`,
    "-map_metadata", "-1",
    output,
  ]);

  const bytes = await finishExec(ff, output, [input], code, "Compression");
  const blob = new Blob([bytes as BlobPart], { type: MIME.mp3 });
  return {
    blob,
    filename: `${audioBase(file.name)}-compressed.mp3`,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}
