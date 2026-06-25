/**
 * compressFormats.ts — programmatic SEO data for the image compressor.
 * Each entry generates /compress-{slug}, targeting a high-intent query.
 */
import type { CompressFormat } from "../lib/imageTools";

export interface CompressSubject {
  slug: string; // /compress-{slug}
  format: CompressFormat; // locked output format for the tool
  name: string; // display, e.g. "PNG"
  h1: string;
  title: string;
  description: string;
  intro: string;
  note: string;
}

export const COMPRESS_SUBJECTS: CompressSubject[] = [
  {
    slug: "png",
    format: "png",
    name: "PNG",
    h1: "Compress PNG",
    title: "Compress PNG — Reduce PNG File Size Free | ZeroUpload",
    description:
      "Compress PNG images and shrink their file size in your browser. Free, unlimited, no upload, no signup. Your images never leave your device.",
    intro:
      "Drop your PNGs to shrink their file size on your device. Great for web pages and email — and because PNG is lossless, the pixels stay sharp.",
    note: "Tip: for photos, switching the format to WEBP or JPG usually shrinks the file far more than PNG can.",
  },
  {
    slug: "jpg",
    format: "jpg",
    name: "JPG",
    h1: "Compress JPG",
    title: "Compress JPG — Reduce JPEG File Size Free | ZeroUpload",
    description:
      "Compress JPG / JPEG photos and reduce file size right in your browser. Free, unlimited, no upload. Drag the quality slider and download instantly.",
    intro:
      "Drop your JPGs and use the quality slider to shrink them. Perfect for uploading photos faster or saving storage — all on your device.",
    note: "Tip: 70–85% quality usually looks identical to the original at a fraction of the size.",
  },
  {
    slug: "jpeg",
    format: "jpg",
    name: "JPEG",
    h1: "Compress JPEG",
    title: "Compress JPEG — Reduce JPEG Photo Size Free | ZeroUpload",
    description:
      "Compress JPEG photos in your browser and cut their file size. Free, unlimited, private — no upload, no signup. Adjust quality and download.",
    intro:
      "Drop your JPEG photos and shrink them with a quality slider. Everything runs on your device — nothing is uploaded.",
    note: "Tip: 70–85% quality is the sweet spot for photos — big savings, no visible loss.",
  },
  {
    slug: "webp",
    format: "webp",
    name: "WEBP",
    h1: "Compress WEBP",
    title: "Compress WEBP — Reduce WebP File Size Free | ZeroUpload",
    description:
      "Compress WEBP images in your browser and shrink their size. Free, unlimited, no upload, no signup. Your files never leave your device.",
    intro:
      "Drop your WEBP images to compress them further on your device. WebP is already efficient — the slider squeezes out even more.",
    note: "Tip: WEBP gives excellent quality at small sizes — ideal for fast-loading websites.",
  },
];

export const COMPRESS_SLUGS = COMPRESS_SUBJECTS.map((s) => s.slug);
