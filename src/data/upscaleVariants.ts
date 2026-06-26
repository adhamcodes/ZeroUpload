/**
 * upscaleVariants.ts — programmatic SEO data for the AI image upscaler.
 *
 * Each entry generates a dedicated landing page at /{slug}, targeting a
 * specific high-intent search query. Same on-device tool, genuinely distinct
 * copy per page (not templated near-duplicates — those get demoted as scaled
 * content). The canonical hub lives at /image-upscaler.
 */

export interface UpscaleVariant {
  /** URL slug → /{slug} */
  slug: string;
  /** Short label for related-links cards. */
  label: string;
  /** Page <h1>. */
  h1: string;
  /** <title> tag. */
  title: string;
  /** Meta description. */
  description: string;
  /** Intro paragraph under the hero. */
  intro: string;
  /** 3 short, query-specific tips. */
  tips: string[];
}

export const UPSCALE_VARIANTS: UpscaleVariant[] = [
  {
    slug: "unblur-image",
    label: "Unblur an image",
    h1: "Unblur an Image — Free, In Your Browser",
    title: "Unblur Image — Free AI Image Unblurrer, No Upload | ZeroUpload",
    description:
      "Sharpen a blurry image with AI — 100% in your browser. Free, unlimited, no signup, no upload. Best on mildly blurry or low-res images. Your image never leaves your device.",
    intro:
      "Drop a soft or out-of-focus image and the AI rebuilds edges and detail while enlarging it 4×. It works best on mild blur and low resolution — it can't invent detail that was never captured — and it all runs on your device.",
    tips: [
      "Mild blur and low resolution recover best; heavy motion blur is the hardest case.",
      "Start from the original file, not a screenshot of it, for the cleanest result.",
      "The result is a larger 4× PNG — zoom in to see the reconstructed detail.",
    ],
  },
  {
    slug: "unblur-photo",
    label: "Unblur a photo",
    h1: "Unblur a Photo Without Uploading It",
    title: "Unblur Photo — Free AI Photo Unblurrer Online | ZeroUpload",
    description:
      "Make a blurry photo clearer with on-device AI. Free, unlimited, private — no upload, no signup, no watermark. Great for slightly soft or small photos.",
    intro:
      "Got a photo that came out a little soft? Drop it here and the AI sharpens and enlarges it 4× right inside your browser. Because nothing is uploaded, even your most private photos stay completely yours.",
    tips: [
      "Slightly soft or small photos sharpen the best.",
      "Good lighting in the original gives the AI more real detail to work with.",
      "Save the PNG and compare before/after with the slider — drag to reveal.",
    ],
  },
  {
    slug: "unblur-picture",
    label: "Unblur a picture",
    h1: "Unblur a Picture — Free AI Tool",
    title: "Unblur Picture Online Free — No Upload, No Signup | ZeroUpload",
    description:
      "Fix a blurry picture in your browser with AI. 100% free and private — nothing is uploaded. Sharpens and enlarges small or soft pictures 4×.",
    intro:
      "Drop a blurry picture and watch the AI clean it up and enlarge it 4×. There's no signup and no upload — the model comes to your browser, not the other way around.",
    tips: [
      "Crop tightly to the part you care about before enhancing for a sharper focus.",
      "Pictures that are simply small (low-res) often see the most dramatic gains.",
      "Heavily pixelated or watermarked pictures are the hardest to recover.",
    ],
  },
  {
    slug: "unblur-face",
    label: "Unblur a face",
    h1: "Unblur a Face in a Photo",
    title: "Unblur a Face — Free AI Face Sharpener, Private | ZeroUpload",
    description:
      "Sharpen a blurry face in a photo with on-device AI. Free, private, no upload. Best on mild blur — it enhances detail, it does not change identity.",
    intro:
      "Drop a photo with a soft or small face and the AI sharpens features while enlarging 4×. It enhances the detail that's already there — it does not invent a different face — and your photo never leaves your device.",
    tips: [
      "Front-facing, evenly lit faces recover the most natural detail.",
      "This sharpens existing detail; it won't reconstruct a heavily obscured face.",
      "Crop close to the face first for the strongest improvement.",
    ],
  },
  {
    slug: "upscale-image",
    label: "Upscale an image",
    h1: "Upscale an Image 4× — Free AI Upscaler",
    title: "Upscale Image — Free AI Image Upscaler 4×, No Upload | ZeroUpload",
    description:
      "Enlarge an image 4× with AI and keep it sharp — 100% in your browser. Free, unlimited, no signup, no upload. Your image never leaves your device.",
    intro:
      "Drop a small image and the AI enlarges it 4× while reconstructing edges and texture — so it stays crisp instead of going blocky. It all runs on your device, with no upload and no limits.",
    tips: [
      "Small, clean source images upscale the most convincingly.",
      "Very large images are scaled to fit first so the tool stays fast and stable.",
      "Output is a 4× PNG — perfect for printing or sharper on-screen display.",
    ],
  },
  {
    slug: "upscale-photo",
    label: "Upscale a photo",
    h1: "Upscale a Photo Without Losing Quality",
    title: "Upscale Photo — Free AI Photo Upscaler Online | ZeroUpload",
    description:
      "Make a photo bigger without it going blurry. AI upscales 4× in your browser — free, private, no upload. Ideal for small or web-sized photos.",
    intro:
      "Need a bigger version of a photo? Drop it here and the AI enlarges it 4× while keeping edges sharp. Private by design — the photo is processed entirely in your browser.",
    tips: [
      "Web-sized and thumbnail photos see the biggest jump in usable size.",
      "Print at the new larger size for noticeably crisper results.",
      "Already-huge photos don't need upscaling and are scaled to fit first.",
    ],
  },
  {
    slug: "upscale-picture",
    label: "Upscale a picture",
    h1: "Upscale a Picture 4× With AI",
    title: "Upscale Picture Free — AI 4× Enlarger, No Signup | ZeroUpload",
    description:
      "Enlarge a picture 4× with AI while keeping it sharp. Free and private in your browser — no upload, no signup, no watermark.",
    intro:
      "Drop a small picture and get a sharp 4× version back. The AI rebuilds detail as it enlarges, and everything happens on your device — nothing is uploaded.",
    tips: [
      "Clean, low-noise pictures enlarge the most cleanly.",
      "Crop out borders or text bars before upscaling for a tidier result.",
      "Save the PNG and zoom in to see the reconstructed edges.",
    ],
  },
  {
    slug: "enhance-photo",
    label: "Enhance a photo",
    h1: "Enhance a Photo With AI — Free",
    title: "Enhance Photo — Free AI Photo Enhancer, In Browser | ZeroUpload",
    description:
      "Improve photo clarity and size with on-device AI. Free, unlimited, private — no upload, no signup. Sharpens detail and enlarges 4×.",
    intro:
      "Drop a photo and the AI sharpens detail, cleans up compression fuzz, and enlarges it 4×. It runs in your browser, so even personal photos never leave your device.",
    tips: [
      "Photos saved/re-saved many times (compression fuzz) clean up nicely.",
      "Good original lighting gives the AI the most real detail to enhance.",
      "Use the before/after slider to see exactly what changed.",
    ],
  },
  {
    slug: "enhance-image-quality",
    label: "Enhance image quality",
    h1: "Enhance Image Quality Online — Free",
    title: "Enhance Image Quality — Free AI Tool, No Upload | ZeroUpload",
    description:
      "Boost image quality with AI: sharper detail, fewer artifacts, 4× larger. 100% in your browser — free, private, no signup, no upload.",
    intro:
      "Drop a low-quality image and the AI improves sharpness, reduces JPEG artifacts, and enlarges it 4×. No upload, no signup — the model comes to your browser instead.",
    tips: [
      "Low-quality JPEGs with blocky artifacts often improve the most.",
      "This boosts detail and size; it can't add detail that was never captured.",
      "The output PNG is larger — ideal for re-using an image at higher quality.",
    ],
  },
  {
    slug: "restore-old-photos",
    label: "Restore old photos",
    h1: "Restore Old Photos — Free, Private, In Your Browser",
    title: "Restore Old Photos Free — AI Photo Restoration, No Upload | ZeroUpload",
    description:
      "Bring old, faded or low-res family photos back to life with AI — 100% in your browser. Free and completely private: your memories never leave your device.",
    intro:
      "Scanned an old family photo? Drop it here and the AI sharpens soft detail and enlarges it 4×, helping faded memories look clearer. Because it's all on-device, your family's photos stay private — they're never uploaded to anyone's server.",
    tips: [
      "Scan or photograph the original as sharply and evenly lit as you can.",
      "The AI sharpens and enlarges; it won't repaint missing pieces or tears.",
      "For precious originals, keep your scan too — this creates a new enhanced copy.",
    ],
  },
  {
    slug: "restore-old-photo",
    label: "Restore an old photo",
    h1: "Restore an Old Photo With AI",
    title: "Restore Old Photo — Free AI Restoration Online, Private | ZeroUpload",
    description:
      "Enhance a single old or faded photo with AI in your browser. Free, no upload, no signup. Sharpens detail and enlarges 4× while keeping it private.",
    intro:
      "Drop one old photo and the AI cleans up softness and enlarges it 4×. Your photo is processed entirely on your device — a private way to give a single treasured memory a clearer new copy.",
    tips: [
      "A flat, evenly lit scan beats an angled phone snapshot.",
      "Expect sharper detail and a bigger image — not removal of scratches or stains.",
      "Compare with the slider to decide if you prefer the enhanced version.",
    ],
  },
  {
    slug: "sharpen-image",
    label: "Sharpen an image",
    h1: "Sharpen an Image With AI — Free",
    title: "Sharpen Image — Free AI Image Sharpener, No Upload | ZeroUpload",
    description:
      "Sharpen a soft image with AI and enlarge it 4×. Free and private in your browser — no upload, no signup, no watermark.",
    intro:
      "Drop a soft image and the AI brings back crisp edges while enlarging it 4×. Unlike a basic sharpen filter, it reconstructs real detail — and it all stays on your device.",
    tips: [
      "Slightly soft images sharpen far more naturally than heavily blurred ones.",
      "AI reconstruction looks cleaner than a one-click sharpen slider.",
      "Save the PNG and view at full size to judge the new sharpness.",
    ],
  },
  {
    slug: "upscale-anime-art",
    label: "Upscale anime / art",
    h1: "Upscale Anime & Art 4× With AI",
    title: "Upscale Anime Art — Free AI 4× Upscaler, No Upload | ZeroUpload",
    description:
      "Enlarge anime, illustrations and digital art 4× with AI while keeping clean lines. Free, private, in your browser — no upload, no signup.",
    intro:
      "Drop anime art or an illustration and the AI enlarges it 4× while keeping line-art crisp and colours clean. This model is especially strong on drawn art — and it runs entirely on your device.",
    tips: [
      "Line art and flat-colour illustrations upscale exceptionally cleanly.",
      "Small avatar or thumbnail art sees the biggest usable-size boost.",
      "Output is a sharp 4× PNG, ready for wallpapers or prints.",
    ],
  },
  {
    slug: "upscale-screenshot",
    label: "Upscale a screenshot",
    h1: "Upscale a Screenshot — Free AI Tool",
    title: "Upscale Screenshot — Free AI Enlarger, No Upload | ZeroUpload",
    description:
      "Make a small or blurry screenshot bigger and clearer with AI. Free and private in your browser — no upload, no signup.",
    intro:
      "Drop a small screenshot and the AI enlarges it 4× while sharpening text edges and UI detail. Handy for slides and docs — and your screenshot never leaves your browser.",
    tips: [
      "Crop to the area you need before upscaling for the cleanest result.",
      "Screenshots of crisp UI upscale better than photos-of-a-screen.",
      "Drop it into slides or docs at the new, sharper size.",
    ],
  },
  {
    slug: "increase-image-resolution",
    label: "Increase image resolution",
    h1: "Increase Image Resolution — Free AI Upscaler",
    title: "Increase Image Resolution — Free AI 4× Tool, No Upload | ZeroUpload",
    description:
      "Increase the resolution of an image 4× with AI while keeping it sharp. 100% in your browser — free, private, no signup, no upload.",
    intro:
      "Need more pixels? Drop an image and the AI multiplies its resolution by 4× while reconstructing detail, so it stays sharp instead of stretched. Fully on-device, with no upload and no limits.",
    tips: [
      "Low-resolution source images gain the most usable detail.",
      "4× means width and height each grow 4× (16× the pixels).",
      "Very large images are scaled to fit first to keep things stable.",
    ],
  },
];

export const UPSCALE_VARIANT_SLUGS = UPSCALE_VARIANTS.map((v) => v.slug);
