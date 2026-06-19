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
import { fetchFile, toBlobURL } from "@ffmpeg/util";
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

async function getFFmpeg(
  onProgress?: (ratio: number, label: string) => void,
): Promise<FFmpeg> {
  if (!ffmpeg) ffmpeg = new FFmpeg();
  const ff = ffmpeg;
  if (!loadPromise) {
    const base = "/ffmpeg";
    onProgress?.(-1, "Loading audio engine (first use only)…");
    loadPromise = (async () => {
      await ff.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      });
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
  await ff.exec(["-i", input, output]);
  const data = await ff.readFile(output);

  await ff.deleteFile(input).catch(() => {});
  await ff.deleteFile(output).catch(() => {});

  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const blob = new Blob([bytes], {
    type: MIME[target] ?? "application/octet-stream",
  });
  const base = file.name.replace(/\.[^.]+$/, "") || "audio";
  return {
    blob,
    filename: `${base}.${target}`,
    ms: Math.max(1, Math.round(performance.now() - start)),
  };
}
