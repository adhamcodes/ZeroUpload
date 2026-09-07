import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const notes = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function requireFile(rel, label = rel) {
  if (!exists(rel)) failures.push(`Missing ${label}: ${rel}`);
}

function requireAny(paths, label) {
  if (!paths.some(exists)) failures.push(`Missing ${label}: expected one of ${paths.join(", ")}`);
}

const sourceFiles = [
  "README.md",
  "package.json",
  "astro.config.mjs",
  "public/_headers",
  "public/manifest.webmanifest",
  "public/robots.txt",
  "src/lib/siteConfig.ts",
  "src/data/conversions.ts",
  "src/lib/engines/audio.ts",
  "src/lib/bgRemove.ts",
  "src/lib/pdfTools.ts",
  "src/components/OcrTool.tsx",
];

for (const file of sourceFiles) requireFile(file, "required source file");

const builtFiles = [
  "dist/index.html",
  "dist/image-converter/index.html",
  "dist/pdf/index.html",
  "dist/audio-converter/index.html",
  "dist/background-remover/index.html",
  "dist/text/index.html",
  "dist/install/index.html",
  "dist/png-to-jpg/index.html",
  "dist/heic-to-jpg/index.html",
  "dist/pdf-to-png/index.html",
  "dist/mp3-to-wav/index.html",
  "dist/remove-background-from-product-photo/index.html",
  "dist/manifest.webmanifest",
  "dist/_headers",
];

for (const file of builtFiles) requireFile(file, "built sale-critical asset");
requireAny(["dist/sitemap-index.xml", "dist/sitemap-0.xml", "dist/sitemap.xml"], "generated sitemap");
requireAny(["dist/ffmpeg/ffmpeg-core.wasm.manifest.json"], "self-hosted ffmpeg WASM manifest");

if (exists("dist/index.html")) {
  const home = fs.readFileSync(path.join(root, "dist/index.html"), "utf8");
  if (!home.includes("ZeroUpload")) failures.push("Built homepage does not contain the ZeroUpload brand.");
  if (!home.toLowerCase().includes("browser")) notes.push("Homepage build did not contain the word 'browser'; review positioning copy.");
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const script of ["build", "audit:sale"]) {
  if (!pkg.scripts?.[script]) failures.push(`package.json is missing the '${script}' script.`);
}

const secretLikeNames = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "id_rsa",
  "id_ed25519",
]);
const secretLikeExt = /\.(pem|p12|pfx|key)$/i;

function walk(dir, rel = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist"].includes(entry.name)) continue;
    const childRel = path.join(rel, entry.name);
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(child, childRel);
    else if (secretLikeNames.has(entry.name) || secretLikeExt.test(entry.name)) {
      failures.push(`Potential secret/private key file is tracked: ${childRel}`);
    }
  }
}
walk(root);

const siteConfig = fs.readFileSync(path.join(root, "src/lib/siteConfig.ts"), "utf8");
if (!siteConfig.includes("zeroupload-8e8.pages.dev")) {
  notes.push("siteConfig.ts no longer points at the known Cloudflare Pages deployment; verify intentional domain migration.");
}

console.log("\nZeroUpload sale-readiness audit");
console.log("==============================");
console.log(`Checked ${sourceFiles.length} critical source files and ${builtFiles.length} critical build outputs.`);
for (const note of notes) console.log(`NOTE: ${note}`);

if (failures.length) {
  console.error(`\nFAILED with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nPASS: build structure, key routes/assets, self-hosted engine artifacts, PWA metadata, and basic secret-file hygiene look sale-ready.");
