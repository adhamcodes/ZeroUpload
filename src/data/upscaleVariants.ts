/**
 * upscaleVariants.ts — programmatic SEO data for the Image Upscaler (Beta).
 *
 * Honest scope: this enlarges images and sharpens edges. It is NOT a magic
 * photo/face restorer (that needs a GPU server, which would mean uploading your
 * image — against our whole reason to exist). So every page here is about
 * *enlarging* and *sharpening*, never "restore a face" or "unblur a person".
 *
 * The canonical hub lives at /image-upscaler.
 */

export interface UpscaleVariant {
  slug: string;
  label: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  tips: string[];
}

export const UPSCALE_VARIANTS: UpscaleVariant[] = [
  {
    slug: "upscale-image",
    label: "Upscale an image",
    h1: "Upscale an Image 4× — Free, In Your Browser",
    title: "Upscale Image — Free AI Image Upscaler 4×, No Upload | ZeroUpload",
    description:
      "Enlarge an image up to 4× and keep edges sharp — 100% in your browser. Free, unlimited, no signup, no upload. Your image never leaves your device.",
    intro:
      "Drop a small image and the upscaler enlarges it up to 4× while keeping edges crisp, so it stays sharp instead of going blocky. It all runs on your device, with no upload and no limits. (Beta — best on small, fairly clean images.)",
    tips: [
      "Small, clean source images enlarge the most convincingly.",
      "Very large images are scaled to fit first so the tool stays fast and stable.",
      "It enlarges and sharpens — it can't invent detail that was never captured.",
    ],
  },
  {
    slug: "upscale-photo",
    label: "Upscale a photo",
    h1: "Upscale a Photo Without It Going Blocky",
    title: "Upscale Photo — Free AI Photo Upscaler Online | ZeroUpload",
    description:
      "Make a photo bigger while keeping edges sharp. Enlarge up to 4× in your browser — free, private, no upload. Best for small or web-sized photos.",
    intro:
      "Need a bigger version of a photo? Drop it here and it's enlarged up to 4× with edges kept sharp. Private by design — the photo is processed entirely in your browser. (Beta: it enlarges and tidies edges; it won't reconstruct missing detail or change faces.)",
    tips: [
      "Web-sized and thumbnail photos see the biggest jump in usable size.",
      "Try Photo mode for real photos; it sharpens faithfully without restyling.",
      "Already-huge photos don't need upscaling and are scaled to fit first.",
    ],
  },
  {
    slug: "upscale-picture",
    label: "Upscale a picture",
    h1: "Upscale a Picture 4× — Free",
    title: "Upscale Picture Free — AI 4× Enlarger, No Signup | ZeroUpload",
    description:
      "Enlarge a picture up to 4× while keeping it sharp. Free and private in your browser — no upload, no signup, no watermark.",
    intro:
      "Drop a small picture and get a larger, sharper version back. Everything happens on your device — nothing is uploaded. (Beta — works best on small, clean pictures.)",
    tips: [
      "Clean, low-noise pictures enlarge the most cleanly.",
      "Crop out borders or text bars before upscaling for a tidier result.",
      "Save the PNG and zoom in to see the sharpened edges.",
    ],
  },
  {
    slug: "upscale-screenshot",
    label: "Upscale a screenshot",
    h1: "Upscale a Screenshot — Free",
    title: "Upscale Screenshot — Free AI Enlarger, No Upload | ZeroUpload",
    description:
      "Make a small or soft screenshot bigger and crisper. Enlarge up to 4× in your browser — free, private, no upload.",
    intro:
      "Drop a small screenshot and it's enlarged up to 4× with sharper edges and UI lines. Handy for slides and docs — and your screenshot never leaves your browser. (Tip: screenshots and graphics often look great in Anime & Art mode, which is tuned for clean lines.)",
    tips: [
      "Crop to the area you need before upscaling for the cleanest result.",
      "For UI and text-heavy screenshots, try Anime & Art mode — it keeps lines crisp.",
      "Drop the result into slides or docs at the new, larger size.",
    ],
  },
  {
    slug: "upscale-anime-art",
    label: "Upscale anime / art",
    h1: "Upscale Anime & Art 4× — Free",
    title: "Upscale Anime Art — Free AI 4× Upscaler, No Upload | ZeroUpload",
    description:
      "Enlarge anime, illustrations and digital art up to 4× while keeping clean lines. Free, private, in your browser — no upload, no signup.",
    intro:
      "Drop anime art or an illustration and switch on Anime & Art mode — it enlarges up to 4× while keeping line art crisp and colours clean. This is where the tool genuinely shines, and it runs entirely on your device.",
    tips: [
      "Use Anime & Art mode — it's tuned for drawn art and line work.",
      "Line art and flat-colour illustrations enlarge exceptionally cleanly.",
      "Small avatar or thumbnail art sees the biggest usable-size boost.",
    ],
  },
  {
    slug: "sharpen-image",
    label: "Sharpen an image",
    h1: "Sharpen an Image — Free",
    title: "Sharpen Image — Free AI Image Sharpener, No Upload | ZeroUpload",
    description:
      "Sharpen a slightly soft image while enlarging it up to 4×. Free and private in your browser — no upload, no signup.",
    intro:
      "Drop a slightly soft image and it's enlarged up to 4× with crisper edges. Unlike a basic sharpen filter it works on the upscaled result, and it all stays on your device. (Beta — it sharpens edges; it can't recover detail that isn't in the original.)",
    tips: [
      "Slightly soft images clean up far better than heavily blurred ones.",
      "Best on graphics, text and product shots with clear edges.",
      "Save the PNG and view at full size to judge the sharpness.",
    ],
  },
  {
    slug: "increase-image-resolution",
    label: "Increase image resolution",
    h1: "Increase Image Resolution — Free",
    title: "Increase Image Resolution — Free AI 4× Tool, No Upload | ZeroUpload",
    description:
      "Increase the resolution of an image up to 4× while keeping it sharp. 100% in your browser — free, private, no signup, no upload.",
    intro:
      "Need more pixels? Drop an image and its resolution is multiplied up to 4× with edges kept sharp, so it stays crisp instead of stretched. Fully on-device, with no upload and no limits. (Beta — it enlarges; it doesn't invent new detail.)",
    tips: [
      "Low-resolution source images gain the most usable size.",
      "4× means width and height each grow up to 4× (16× the pixels).",
      "Very large images are scaled to fit first to keep things stable.",
    ],
  },
  {
    slug: "enhance-image-quality",
    label: "Enhance image quality",
    h1: "Enhance Image Quality — Free",
    title: "Enhance Image Quality — Free AI Tool, No Upload | ZeroUpload",
    description:
      "Enlarge an image up to 4× and sharpen its edges, in your browser. Free, private, no signup, no upload.",
    intro:
      "Drop a small or soft image and it's enlarged up to 4× with cleaner, sharper edges. No upload, no signup — the model comes to your browser instead. (Beta — it improves size and sharpness, not missing detail.)",
    tips: [
      "Small, lightly compressed images improve the most.",
      "It boosts size and edge sharpness; it can't add detail that was never captured.",
      "The output PNG is larger — handy for re-using an image at a bigger size.",
    ],
  },
];

export const UPSCALE_VARIANT_SLUGS = UPSCALE_VARIANTS.map((v) => v.slug);
