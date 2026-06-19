/**
 * THE BRAIN — ZeroUpload programmatic SEO engine.
 *
 * Everything about which conversions exist, and the SEO metadata for each
 * generated page, flows from this single file. Add a format or flip a flag
 * here and the build produces new fully-formed, SEO-optimised static pages
 * automatically (see src/pages/[from]-to-[to].astro).
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
      q: `Will it work offline?`,
      a: `Yes. Once the page has loaded, the ${c.from.name} to ${c.to.name} conversion works even with your internet disconnected, because everything happens locally.`,
    },
  ];
}
