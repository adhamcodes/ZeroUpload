/**
 * THE BRAIN — ZeroUpload programmatic SEO engine.
 *
 * One file defines every format, every conversion pair, the engine that powers
 * it, and the SEO metadata for the generated page. Add a format here and the
 * build spawns new fully-formed, SEO-optimised static pages automatically
 * (see src/pages/[from]-to-[to].astro).
 *
 * Engines (all 100% in-browser, no upload):
 *   - "image"   Canvas API (png/jpg/jpeg/webp/gif/bmp/svg)
 *   - "heic"    libheif via heic-to (Apple HEIC photos)
 *   - "pdf2img" pdf.js (PDF pages -> images)
 *   - "img2pdf" pdf-lib (image -> PDF)
 *   - "audio"   ffmpeg.wasm (mp3/wav/ogg/m4a/flac/aac)
 */

export type Category = "image" | "document" | "audio";
export type EngineGroup = "canvas" | "heic" | "pdf" | "audio";
export type EngineId = "image" | "heic" | "pdf2img" | "img2pdf" | "audio";

export interface Format {
  id: string;
  name: string;
  fullName: string;
  category: Category;
  engineGroup: EngineGroup;
  mime: string;
  blurb: string;
  whatIs: string;
  useCases: string[];
  pros: string[];
  cons: string[];
  /** Canvas group only: can the canvas engine read / write it? */
  canDecode?: boolean;
  canEncode?: boolean;
  /** Optional override for the file-picker accept attribute. */
  accept?: string;
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
    title: "PDF & Document Converter",
    slug: "document-converter",
    tagline:
      "Turn PDFs into images and images into PDFs — privately, on your device.",
  },
  audio: {
    title: "Audio Converter",
    slug: "audio-converter",
    tagline:
      "Convert audio files locally with ffmpeg in your browser. Your media never leaves your machine.",
  },
};

export const FORMATS: Format[] = [
  // ---------- Canvas image formats ----------
  {
    id: "png", name: "PNG", fullName: "Portable Network Graphics",
    category: "image", engineGroup: "canvas", mime: "image/png",
    blurb: "a lossless image format with transparency support, ideal for graphics, logos and screenshots",
    whatIs: "PNG (Portable Network Graphics) is a lossless raster format with a full alpha (transparency) channel. It reproduces sharp edges and text without compression artefacts, making it the default for logos, icons, UI assets and screenshots.",
    useCases: ["logos and brand assets that need a transparent background", "screenshots where text must stay crisp", "UI elements, icons and illustrations"],
    pros: ["Lossless quality", "Transparency (alpha) support", "Great for sharp edges and text"],
    cons: ["Larger files than JPG for photos", "No animation"],
    canDecode: true, canEncode: true,
  },
  {
    id: "jpg", name: "JPG", fullName: "JPEG Image",
    category: "image", engineGroup: "canvas", mime: "image/jpeg",
    blurb: "a widely supported, compressed image format perfect for photographs and web images",
    whatIs: "JPG (also written JPEG) is a lossy compressed format engineered for photographs. It discards detail the eye barely notices to produce far smaller files, and it is the most universally supported image format in existence.",
    useCases: ["photographs shared online or by email", "web images where small file size matters", "anywhere maximum compatibility is required"],
    pros: ["Very small file sizes", "Universally supported", "Ideal for photos"],
    cons: ["Lossy — quality degrades on re-saves", "No transparency"],
    canDecode: true, canEncode: true,
  },
  {
    id: "jpeg", name: "JPEG", fullName: "JPEG Image",
    category: "image", engineGroup: "canvas", mime: "image/jpeg",
    blurb: "the full name for the JPG format — a compressed image standard used everywhere online",
    whatIs: "JPEG and JPG are the same format; only the file extension differs. Older Windows software wanted three-letter extensions, so '.jpg' became common, while '.jpeg' is the original spelling. Both open identically everywhere.",
    useCases: ["renaming or normalising photo extensions", "satisfying software that expects one specific spelling", "photographs and web imagery"],
    pros: ["Identical to JPG", "Small files", "Universal support"],
    cons: ["Lossy", "No transparency"],
    canDecode: true, canEncode: true,
  },
  {
    id: "webp", name: "WEBP", fullName: "WebP Image",
    category: "image", engineGroup: "canvas", mime: "image/webp",
    blurb: "a modern Google format offering superior compression and smaller file sizes for the web",
    whatIs: "WebP is a modern Google format with both lossy and lossless modes. At equal quality it is typically 25–35% smaller than JPG or PNG, supports transparency, and is now backed by every major browser.",
    useCases: ["speeding up website load times", "replacing heavier PNG/JPG assets", "modern web galleries and thumbnails"],
    pros: ["Smaller than JPG/PNG at the same quality", "Supports transparency", "Modern browser support"],
    cons: ["Less universal in old desktop apps", "Occasionally rejected by legacy tools"],
    canDecode: true, canEncode: true,
  },
  {
    id: "gif", name: "GIF", fullName: "Graphics Interchange Format",
    category: "image", engineGroup: "canvas", mime: "image/gif",
    blurb: "a classic format known for animations and simple graphics with a limited colour palette",
    whatIs: "GIF (Graphics Interchange Format) is a veteran format limited to 256 colours per frame, best known for simple animations and flat graphics. It handles photos poorly but remains everywhere thanks to decades of compatibility.",
    useCases: ["simple looping animations", "low-colour graphics and stickers", "legacy assets that must stay GIF"],
    pros: ["Universally supported", "Supports simple animation", "Tiny for flat graphics"],
    cons: ["Only 256 colours", "Poor for photos", "Large for anything detailed"],
    canDecode: true, canEncode: false,
  },
  {
    id: "bmp", name: "BMP", fullName: "Bitmap Image",
    category: "image", engineGroup: "canvas", mime: "image/bmp",
    blurb: "an uncompressed raster format that stores pixel data with maximum fidelity",
    whatIs: "BMP (Bitmap) is an old, typically uncompressed Windows raster format. It stores raw pixel data, so quality is perfect but files are enormous — which is why converting BMP to PNG, JPG or WebP is so common.",
    useCases: ["exporting from legacy Windows software", "raw pixel-perfect intermediates", "files that must shrink for sharing"],
    pros: ["Lossless, raw pixels", "Simple, well-documented"],
    cons: ["Huge file sizes", "No real web support", "No compression"],
    canDecode: true, canEncode: false,
  },
  {
    id: "svg", name: "SVG", fullName: "Scalable Vector Graphics",
    category: "image", engineGroup: "canvas", mime: "image/svg+xml",
    blurb: "a resolution-independent vector format that scales perfectly to any size",
    whatIs: "SVG (Scalable Vector Graphics) is an XML-based vector format. It stores shapes rather than pixels, so it scales to any size without losing sharpness. Many platforms require a raster, which is why converting SVG to PNG or JPG is frequently needed.",
    useCases: ["logos and icons at any resolution", "exporting vectors to a raster for social media", "generating high-resolution image assets"],
    pros: ["Infinitely scalable", "Tiny for simple graphics", "Editable as code"],
    cons: ["Not a photo format", "Rejected by many raster-only platforms"],
    canDecode: true, canEncode: false,
  },
  // ---------- HEIC (Apple) ----------
  {
    id: "heic", name: "HEIC", fullName: "High Efficiency Image Container",
    category: "image", engineGroup: "heic", mime: "image/heic",
    accept: ".heic,.heif,image/heic,image/heif",
    blurb: "Apple's modern, highly compressed photo format used by iPhones since iOS 11",
    whatIs: "HEIC (High Efficiency Image Container) is the format iPhones use to save photos since iOS 11. It compresses better than JPG at the same quality, but many websites, Windows PCs and older apps cannot open it — which is why converting HEIC is one of the most-searched tasks online.",
    useCases: ["opening iPhone photos on a PC or the web", "sharing photos with people on any device", "uploading to sites that reject HEIC"],
    pros: ["Excellent compression", "High image quality", "Saves storage on iPhones"],
    cons: ["Poor compatibility outside Apple", "Rejected by many websites and apps"],
    canDecode: false, canEncode: false,
  },
  // ---------- PDF ----------
  {
    id: "pdf", name: "PDF", fullName: "Portable Document Format",
    category: "document", engineGroup: "pdf", mime: "application/pdf",
    blurb: "the universal document format that looks identical on every device",
    whatIs: "PDF (Portable Document Format) preserves layout, fonts and images so a document looks the same everywhere. Converting PDF pages to images is handy for previews and sharing, while turning images into a PDF is perfect for documents, receipts and portfolios.",
    useCases: ["extracting pages as images", "turning photos or scans into a single document", "sharing layout-perfect files"],
    pros: ["Identical on every device", "Great for documents and printing", "Universally supported"],
    cons: ["Not directly editable as an image", "Can be large"],
    canDecode: false, canEncode: false,
  },
  // ---------- Audio ----------
  {
    id: "mp3", name: "MP3", fullName: "MPEG-1 Audio Layer III",
    category: "audio", engineGroup: "audio", mime: "audio/mpeg",
    blurb: "the universal compressed audio format that plays on virtually any device",
    whatIs: "MP3 is the most widely supported compressed audio format on earth. It shrinks audio dramatically with quality good enough for nearly all listening, and plays on essentially every device and app.",
    useCases: ["music for any phone, car or player", "podcasts and voice recordings", "anywhere maximum compatibility matters"],
    pros: ["Plays everywhere", "Small files", "Great general-purpose format"],
    cons: ["Lossy compression", "No multichannel surround"],
  },
  {
    id: "wav", name: "WAV", fullName: "Waveform Audio File Format",
    category: "audio", engineGroup: "audio", mime: "audio/wav",
    blurb: "an uncompressed, lossless audio format with perfect fidelity",
    whatIs: "WAV is an uncompressed, lossless audio format that stores raw sound exactly. The quality is perfect and editing-friendly, but the files are large, so WAV is common for production and converting to MP3 for sharing.",
    useCases: ["audio editing and production", "archiving master recordings", "feeding tools that need uncompressed input"],
    pros: ["Lossless, perfect quality", "Ideal for editing", "Universally readable"],
    cons: ["Very large files", "Not practical for casual sharing"],
  },
  {
    id: "ogg", name: "OGG", fullName: "Ogg Vorbis Audio",
    category: "audio", engineGroup: "audio", mime: "audio/ogg",
    blurb: "a free, open, high-quality compressed audio format",
    whatIs: "OGG (Vorbis) is a free, open compressed audio format that often beats MP3 in quality at the same size. It is popular in gaming and open-source software, though desktop support is less universal than MP3.",
    useCases: ["game audio and open-source apps", "high-quality streaming", "patent-free distribution"],
    pros: ["Better quality than MP3 at equal size", "Free and open", "Good for streaming"],
    cons: ["Less universal hardware support", "Some apps don't accept it"],
  },
  {
    id: "m4a", name: "M4A", fullName: "MPEG-4 Audio (AAC)",
    category: "audio", engineGroup: "audio", mime: "audio/mp4",
    blurb: "Apple's efficient AAC audio format used by iTunes and Apple Music",
    whatIs: "M4A is an MPEG-4 audio container, usually holding AAC. It offers better quality than MP3 at the same bitrate and is the default for iTunes, Apple Music and voice memos, but plays less universally than MP3.",
    useCases: ["Apple ecosystem audio", "higher quality than MP3 at small sizes", "voice memos and downloads"],
    pros: ["Better quality than MP3 per byte", "Efficient compression", "Standard on Apple devices"],
    cons: ["Less universal than MP3", "Occasionally rejected by older players"],
  },
  {
    id: "flac", name: "FLAC", fullName: "Free Lossless Audio Codec",
    category: "audio", engineGroup: "audio", mime: "audio/flac",
    blurb: "a lossless compressed format beloved by audiophiles",
    whatIs: "FLAC (Free Lossless Audio Codec) compresses audio with zero quality loss — typically to about half the size of WAV. It is the audiophile favourite for archiving and high-fidelity listening, at the cost of larger files than lossy formats.",
    useCases: ["lossless music archiving", "high-fidelity listening", "preserving quality while saving space vs WAV"],
    pros: ["Lossless quality", "Smaller than WAV", "Free and open"],
    cons: ["Larger than MP3/AAC", "Not supported by every device"],
  },
  {
    id: "aac", name: "AAC", fullName: "Advanced Audio Coding",
    category: "audio", engineGroup: "audio", mime: "audio/aac",
    blurb: "a modern lossy codec offering better quality than MP3 at the same bitrate",
    whatIs: "AAC (Advanced Audio Coding) is the successor to MP3, delivering better sound at the same bitrate. It powers YouTube, Apple Music and most streaming, and is widely (though not universally) supported.",
    useCases: ["streaming and downloads", "higher quality than MP3 at the same size", "modern device playback"],
    pros: ["Better quality than MP3 per byte", "Widely supported", "Streaming standard"],
    cons: ["Lossy", "Slightly less universal than MP3"],
  },
];

export const FORMAT_BY_ID: Record<string, Format> = Object.fromEntries(
  FORMATS.map((f) => [f.id, f]),
);

export interface Conversion {
  from: Format;
  to: Format;
  engine: EngineId;
  slug: string;
}

function conv(from: Format, to: Format, engine: EngineId): Conversion {
  return { from, to, engine, slug: `${from.id}-to-${to.id}` };
}

/** Auto-generate every supported pair, tagging each with its engine. */
function generateConversions(): Conversion[] {
  const out: Conversion[] = [];
  const f = FORMAT_BY_ID;
  const canvasTargets = FORMATS.filter(
    (x) => x.engineGroup === "canvas" && x.canEncode,
  );

  // 1. Canvas image -> image
  for (const from of FORMATS) {
    if (from.engineGroup !== "canvas" || !from.canDecode) continue;
    for (const to of canvasTargets) {
      if (from.id === to.id) continue;
      out.push(conv(from, to, "image"));
    }
  }

  // 2. HEIC -> jpg/jpeg/png/webp
  for (const to of ["jpg", "jpeg", "png", "webp"]) {
    out.push(conv(f.heic, f[to], "heic"));
  }

  // 3. PDF -> images, and images -> PDF
  for (const to of ["jpg", "png"]) {
    out.push(conv(f.pdf, f[to], "pdf2img"));
  }
  for (const from of ["jpg", "jpeg", "png", "webp"]) {
    out.push(conv(f[from], f.pdf, "img2pdf"));
  }

  // 4. Audio -> audio (all pairs)
  const audio = FORMATS.filter((x) => x.engineGroup === "audio");
  for (const from of audio) {
    for (const to of audio) {
      if (from.id === to.id) continue;
      out.push(conv(from, to, "audio"));
    }
  }

  return out;
}

export const CONVERSIONS: Conversion[] = generateConversions();

export const CONVERSION_BY_SLUG: Record<string, Conversion> = Object.fromEntries(
  CONVERSIONS.map((c) => [c.slug, c]),
);

export function conversionsByCategory(category: Category): Conversion[] {
  return CONVERSIONS.filter(
    (c) => c.from.category === category || c.to.category === category,
  );
}

/** Related conversions for internal linking (SEO clustering). */
export function relatedConversions(slug: string, limit = 6): Conversion[] {
  const current = CONVERSION_BY_SLUG[slug];
  if (!current) return CONVERSIONS.slice(0, limit);
  const sameEngine = CONVERSIONS.filter(
    (c) =>
      c.slug !== slug &&
      (c.from.id === current.from.id ||
        c.to.id === current.to.id ||
        c.engine === current.engine),
  );
  return sameEngine.slice(0, limit);
}

/* ---------- SEO copy generation ---------- */

export function pageTitle(c: Conversion): string {
  return `Convert ${c.from.name} to ${c.to.name} — Free, Private, In-Browser | ZeroUpload`;
}

export function metaDescription(c: Conversion): string {
  return `Convert ${c.from.name} to ${c.to.name} online for free. Files never leave your device — 100% private, no upload, no signup, no limits.`;
}

export function h1(c: Conversion): string {
  return `Convert ${c.from.name} to ${c.to.name}`;
}

export function autoIntro(c: Conversion): string {
  const reason = c.to.pros[0]?.toLowerCase() ?? "a more useful format";
  return `Converting ${c.from.name} to ${c.to.name} is a common task when you need ${reason}. ${c.from.whatIs} ${c.to.name}, on the other hand, gives you ${c.to.pros
    .slice(0, 2)
    .join(" and ")
    .toLowerCase()}. ZeroUpload performs this conversion entirely inside your browser, so your ${c.from.name} file is never uploaded to a server.`;
}

export function whenToConvert(c: Conversion): string {
  return `You should convert ${c.from.name} to ${c.to.name} when you want ${c.to.useCases[0]} but your source is ${c.from.name}. Typical situations include ${c.from.useCases
    .slice(0, 2)
    .join(", ")}, where the destination expects ${c.to.name} instead.`;
}

export function faq(c: Conversion): { q: string; a: string }[] {
  return [
    {
      q: `How do I convert ${c.from.name} to ${c.to.name}?`,
      a: `Drop your ${c.from.name} file into the box above (or click to choose it), and ZeroUpload converts it to ${c.to.name} right inside your browser. Then download the result. No account, no waiting.`,
    },
    {
      q: `Is it safe to convert ${c.from.name} files here?`,
      a: `Completely. ZeroUpload does the entire conversion on your own device. Your ${c.from.name} file is never uploaded to any server, so your data stays 100% private.`,
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
      q: `Do my files get uploaded?`,
      a: `No. The ${c.from.name} to ${c.to.name} conversion runs entirely inside your browser, on your device, so your files are never sent to a server. You need internet to load the page, but the conversion itself is local — you can even disconnect mid-convert and it still finishes.`,
    },
  ];
}
