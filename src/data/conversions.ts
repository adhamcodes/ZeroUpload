/**
 * THE BRAIN — ZeroUpload programmatic SEO engine.
 *
 * Everything about which conversions exist, and the SEO metadata for each
 * generated page, flows from this single file. Add a format or flip a flag
 * here and the build produces new fully-formed, SEO-optimised static pages
 * automatically (see src/pages/[from]-to-[to].astro).
 *
 * ANTI-THIN-CONTENT NOTE:
 * Each Format carries genuinely unique editorial fields (whatIs / useCases /
 * pros / cons). Because every page combines two DIFFERENT formats, the body
 * copy differs substantially from page to page — not just the H1/keywords.
 * For the highest-volume pages we additionally inject hand-written Markdown
 * via src/data/customCopy.ts. Together these keep us clear of Google's
 * "thin programmatic spam" filter.
 *
 * Engine support flags are RELATIVE TO THE CURRENTLY SHIPPED ENGINE
 * (the in-browser Canvas image engine). We only generate pages for
 * conversions we can actually perform, so every indexed page genuinely
 * works — critical for SEO trust and low bounce rates.
 */

export type Category = "image" | "document" | "audio";

export interface Format {
  /** lowercase url + extension token, e.g. "png" */
  id: string;
  /** Display name, e.g. "PNG" */
  name: string;
  /** Human full name, e.g. "Portable Network Graphics" */
  fullName: string;
  category: Category;
  /** MIME type used for encoding (targets only need a valid one) */
  mime: string;
  /** One-line description used in SEO body copy */
  blurb: string;
  /** Unique 2-3 sentence explainer — drives per-page content uniqueness */
  whatIs: string;
  /** Real-world situations this format is used in */
  useCases: string[];
  /** Strengths */
  pros: string[];
  /** Weaknesses */
  cons: string[];
  /** Can the shipped engine DECODE (read) this format? */
  canDecode: boolean;
  /** Can the shipped engine ENCODE (write) this format? */
  canEncode: boolean;
}

export const CATEGORIES: Record<
  Category,
  { title: string; slug: string; tagline: string }
> = {
  image: {
    title: "Image Converter",
    slug: "image-converter",
    tagline:
      "Convert images instantly in your browser. No upload, no quality games, no limits.",
  },
  document: {
    title: "Document Converter",
    slug: "document-converter",
    tagline:
      "Convert and transform documents privately, right on your device.",
  },
  audio: {
    title: "Audio Converter",
    slug: "audio-converter",
    tagline: "Convert audio files locally — your media never leaves your machine.",
  },
};

export const FORMATS: Format[] = [
  {
    id: "png",
    name: "PNG",
    fullName: "Portable Network Graphics",
    category: "image",
    mime: "image/png",
    blurb:
      "a lossless image format with transparency support, ideal for graphics, logos and screenshots",
    whatIs:
      "PNG (Portable Network Graphics) is a lossless raster format created as a free, patent-unencumbered replacement for GIF. It supports a full alpha (transparency) channel and reproduces sharp edges and text without compression artefacts, which makes it the default choice for logos, icons, UI assets and screenshots.",
    useCases: [
      "logos and brand assets that need a transparent background",
      "screenshots where text must stay crisp",
      "UI elements, icons and illustrations",
    ],
    pros: ["Lossless quality", "Transparency (alpha) support", "Great for sharp edges and text"],
    cons: ["Larger files than JPG for photos", "No animation"],
    canDecode: true,
    canEncode: true,
  },
  {
    id: "jpg",
    name: "JPG",
    fullName: "JPEG Image",
    category: "image",
    mime: "image/jpeg",
    blurb:
      "a widely supported, compressed image format perfect for photographs and web images",
    whatIs:
      "JPG (also written JPEG) is a lossy compressed format engineered for photographs. Its compression discards detail the human eye barely notices, producing dramatically smaller files than lossless formats. It is the most universally supported image format on earth — every browser, phone and editor reads it.",
    useCases: [
      "photographs shared online or by email",
      "web images where small file size matters",
      "anywhere maximum compatibility is required",
    ],
    pros: ["Very small file sizes", "Universally supported", "Ideal for photos"],
    cons: ["Lossy — quality degrades on re-saves", "No transparency"],
    canDecode: true,
    canEncode: true,
  },
  {
    id: "jpeg",
    name: "JPEG",
    fullName: "JPEG Image",
    category: "image",
    mime: "image/jpeg",
    blurb:
      "the full name for the JPG format — a compressed image standard used everywhere online",
    whatIs:
      "JPEG and JPG are the exact same format — the only difference is the file extension. Older Windows software required three-letter extensions, which is why '.jpg' became common, while '.jpeg' is the original full spelling. Both open identically everywhere.",
    useCases: [
      "renaming or normalising photo extensions",
      "satisfying software that expects one specific spelling",
      "photographs and web imagery",
    ],
    pros: ["Identical to JPG", "Small files", "Universal support"],
    cons: ["Lossy", "No transparency"],
    canDecode: true,
    canEncode: true,
  },
  {
    id: "webp",
    name: "WEBP",
    fullName: "WebP Image",
    category: "image",
    mime: "image/webp",
    blurb:
      "a modern Google format offering superior compression and smaller file sizes for the web",
    whatIs:
      "WebP is a modern image format developed by Google that delivers both lossy and lossless compression. At equivalent quality it is typically 25–35% smaller than JPG or PNG, and it supports transparency and animation. It is now supported by every major browser, making it a favourite for fast-loading websites.",
    useCases: [
      "speeding up website load times",
      "replacing heavier PNG/JPG assets",
      "modern web galleries and thumbnails",
    ],
    pros: ["Smaller than JPG/PNG at the same quality", "Supports transparency", "Modern browser support"],
    cons: ["Less universal in old desktop apps", "Occasionally rejected by legacy tools"],
    canDecode: true,
    canEncode: true,
  },
  {
    id: "gif",
    name: "GIF",
    fullName: "Graphics Interchange Format",
    category: "image",
    mime: "image/gif",
    blurb:
      "a classic format known for animations and simple graphics with a limited colour palette",
    whatIs:
      "GIF (Graphics Interchange Format) is a veteran format limited to a 256-colour palette per frame. It is best known for simple animations and low-complexity graphics. Because of its palette limit it handles photographs poorly, but it remains everywhere thanks to decades of compatibility.",
    useCases: [
      "simple looping animations",
      "low-colour graphics and stickers",
      "legacy assets that must stay GIF",
    ],
    pros: ["Universally supported", "Supports simple animation", "Tiny for flat graphics"],
    cons: ["Only 256 colours", "Poor for photos", "Large for anything detailed"],
    canDecode: true,
    canEncode: false,
  },
  {
    id: "bmp",
    name: "BMP",
    fullName: "Bitmap Image",
    category: "image",
    mime: "image/bmp",
    blurb:
      "an uncompressed raster format that stores pixel data with maximum fidelity",
    whatIs:
      "BMP (Bitmap) is an old, typically uncompressed raster format from the Windows ecosystem. It stores raw pixel data, so quality is perfect but files are enormous. It is rarely used on the web today, which is why converting BMP to a compressed format like PNG, JPG or WebP is so common.",
    useCases: [
      "exporting from legacy Windows software",
      "raw pixel-perfect intermediates",
      "files that must shrink for sharing",
    ],
    pros: ["Lossless, raw pixels", "Simple, well-documented"],
    cons: ["Huge file sizes", "No real web support", "No compression"],
    canDecode: true,
    canEncode: false,
  },
  {
    id: "svg",
    name: "SVG",
    fullName: "Scalable Vector Graphics",
    category: "image",
    mime: "image/svg+xml",
    blurb:
      "a resolution-independent vector format that scales perfectly to any size",
    whatIs:
      "SVG (Scalable Vector Graphics) is an XML-based vector format. Instead of pixels it stores shapes and paths, so it scales to any size without ever losing sharpness. It is ideal for logos and icons, but many platforms (social media, some editors) require a raster format, which is why converting SVG to PNG or JPG is frequently needed.",
    useCases: [
      "logos and icons at any resolution",
      "exporting vectors to a raster for social media",
      "generating high-resolution image assets",
    ],
    pros: ["Infinitely scalable", "Tiny for simple graphics", "Editable as code"],
    cons: ["Not a photo format", "Rejected by many raster-only platforms"],
    canDecode: true,
    canEncode: false,
  },
];

export const FORMAT_BY_ID: Record<string, Format> = Object.fromEntries(
  FORMATS.map((f) => [f.id, f]),
);

export interface Conversion {
  from: Format;
  to: Format;
  /** url slug, e.g. "heic-to-jpg" */
  slug: string;
}

/**
 * Auto-generate every valid (decode -> encode) pair within a category.
 * This is the carpet-bomb: one rule here = N new pages at build time.
 */
function generateConversions(): Conversion[] {
  const out: Conversion[] = [];
  for (const from of FORMATS) {
    if (!from.canDecode) continue;
    for (const to of FORMATS) {
      if (!to.canEncode) continue;
      if (from.id === to.id) continue;
      // Same category only (cross-category needs dedicated engines later).
      if (from.category !== to.category) continue;
      out.push({ from, to, slug: `${from.id}-to-${to.id}` });
    }
  }
  return out;
}

export const CONVERSIONS: Conversion[] = generateConversions();

export const CONVERSION_BY_SLUG: Record<string, Conversion> = Object.fromEntries(
  CONVERSIONS.map((c) => [c.slug, c]),
);

/** Related conversions for internal linking (SEO clustering). */
export function relatedConversions(slug: string, limit = 6): Conversion[] {
  const current = CONVERSION_BY_SLUG[slug];
  if (!current) return CONVERSIONS.slice(0, limit);
  return CONVERSIONS.filter(
    (c) =>
      c.slug !== slug &&
      (c.from.id === current.from.id ||
        c.to.id === current.to.id ||
        c.from.category === current.from.category),
  ).slice(0, limit);
}

/* ---------- SEO copy generation (templated, per-pair) ---------- */

export function pageTitle(c: Conversion): string {
  return `Convert ${c.from.name} to ${c.to.name} — Free, Private, In-Browser | ZeroUpload`;
}

export function metaDescription(c: Conversion): string {
  return `Convert ${c.from.name} to ${c.to.name} online for free. Files never leave your device — 100% private, no upload, no signup, no limits. Works even offline.`;
}

export function h1(c: Conversion): string {
  return `Convert ${c.from.name} to ${c.to.name}`;
}

/**
 * A unique intro paragraph built from BOTH formats' editorial data, so every
 * page reads differently. Used when no hand-written custom copy exists.
 */
export function autoIntro(c: Conversion): string {
  const reason =
    c.to.pros[0]?.toLowerCase() ?? "a more useful format";
  return `Converting ${c.from.name} to ${c.to.name} is a common task when you need ${reason}. ${c.from.whatIs} ${c.to.name}, on the other hand, gives you ${c.to.pros
    .slice(0, 2)
    .join(" and ")
    .toLowerCase()}. ZeroUpload performs this conversion entirely inside your browser, so your ${c.from.name} file is never uploaded to a server.`;
}

/** When-to-use guidance, unique per pair. */
export function whenToConvert(c: Conversion): string {
  return `You should convert ${c.from.name} to ${c.to.name} when you want ${c.to.useCases[0]} but your source is ${c.from.name}. Typical situations include ${c.from.useCases
    .slice(0, 2)
    .join(", ")}, where the destination platform expects ${c.to.name} instead.`;
}

export function faq(c: Conversion): { q: string; a: string }[] {
  return [
    {
      q: `How do I convert ${c.from.name} to ${c.to.name}?`,
      a: `Drag your ${c.from.name} file into the box above (or click to choose it), and ZeroUpload instantly converts it to ${c.to.name} right inside your browser. Then download the result. No account, no waiting.`,
    },
    {
      q: `Is it safe to convert ${c.from.name} files here?`,
      a: `Completely. ZeroUpload does the entire conversion on your own device using your browser. Your ${c.from.name} file is never uploaded to any server, so your data stays 100% private.`,
    },
    {
      q: `Does converting ${c.from.name} to ${c.to.name} cost anything?`,
      a: `No. It is free with no limits and no signup. Because the conversion runs on your device, there are no server costs and therefore no paywalls.`,
    },
    {
      q: `What is the difference between ${c.from.name} and ${c.to.name}?`,
      a: `${c.from.name} is ${c.from.blurb}. ${c.to.name} is ${c.to.blurb}. Converting from ${c.from.name} to ${c.to.name} trades ${c.from.pros[0]?.toLowerCase()} for ${c.to.pros[0]?.toLowerCase()}.`,
    },
    {
      q: `Will it work offline?`,
      a: `Yes. Once the page has loaded, the ${c.from.name} to ${c.to.name} conversion works even with your internet disconnected, because everything happens locally.`,
    },
  ];
}
