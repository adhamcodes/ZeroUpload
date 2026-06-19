/**
 * Prepares the self-hosted ffmpeg.wasm single-thread core for /public/ffmpeg.
 *
 * WHY THIS SPLITS THE WASM:
 * Cloudflare Pages rejects any single asset larger than 25 MiB, and
 * ffmpeg-core.wasm is ~30.7 MiB. So we split the .wasm into < 25 MiB parts
 * and write a manifest. The browser fetches the parts (same-origin, $0,
 * private, cached, and gzip-compressed over the wire by Cloudflare) and
 * reassembles the exact original bytes before loading the engine.
 *
 * Result: still 100% in-browser, offline-after-cache, no external CDN, $0.
 * Runs on predev / prebuild. Output is gitignored and regenerated on build.
 */
import {
  mkdirSync,
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const srcDir = resolve(root, "node_modules/@ffmpeg/core/dist/umd");
const outDir = resolve(root, "public/ffmpeg");

// Stay comfortably under Cloudflare's 25 MiB per-file limit.
const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MiB

try {
  // Start clean so stale full-size files are never deployed.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // 1. Core JS loader (small) — copy as-is.
  const coreJs = resolve(srcDir, "ffmpeg-core.js");
  if (!existsSync(coreJs)) {
    console.warn("[copy-ffmpeg] missing ffmpeg-core.js — run npm install. Skipping.");
    process.exit(0);
  }
  copyFileSync(coreJs, resolve(outDir, "ffmpeg-core.js"));

  // 2. Split the wasm into < 25 MiB parts.
  const wasmPath = resolve(srcDir, "ffmpeg-core.wasm");
  const wasm = readFileSync(wasmPath);
  const parts = [];
  let index = 0;
  for (let offset = 0; offset < wasm.length; offset += CHUNK_SIZE) {
    const name = `ffmpeg-core.wasm.part${index}`;
    writeFileSync(resolve(outDir, name), wasm.subarray(offset, offset + CHUNK_SIZE));
    parts.push(name);
    index += 1;
  }

  // 3. Manifest so the runtime knows how many parts to fetch.
  writeFileSync(
    resolve(outDir, "ffmpeg-core.wasm.manifest.json"),
    JSON.stringify({ totalBytes: wasm.length, parts }, null, 2),
  );

  const mib = (n) => (n / (1024 * 1024)).toFixed(1);
  console.log(
    `[copy-ffmpeg] core ready: ${parts.length} wasm part(s), ` +
      `${mib(wasm.length)} MiB total (largest part < ${mib(CHUNK_SIZE)} MiB)`,
  );
} catch (err) {
  console.warn("[copy-ffmpeg] could not prepare ffmpeg core:", err.message);
}
