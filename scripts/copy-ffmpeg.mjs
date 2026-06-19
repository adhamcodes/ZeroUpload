/**
 * Copies the self-hosted ffmpeg.wasm single-thread core into /public/ffmpeg
 * so it is served from our OWN origin (same-origin, $0 on Cloudflare, private).
 * Runs automatically before `dev` and `build`. The large core is gitignored —
 * it is regenerated from node_modules on every install/build instead of being
 * committed, keeping the repo lean.
 */
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const srcDir = resolve(root, "node_modules/@ffmpeg/core/dist/umd");
const outDir = resolve(root, "public/ffmpeg");

const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

try {
  mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    const src = resolve(srcDir, f);
    if (!existsSync(src)) {
      console.warn(`[copy-ffmpeg] missing ${src} — run npm install. Skipping.`);
      continue;
    }
    copyFileSync(src, resolve(outDir, f));
  }
  console.log("[copy-ffmpeg] ffmpeg core copied to public/ffmpeg");
} catch (err) {
  console.warn("[copy-ffmpeg] could not copy ffmpeg core:", err.message);
}
