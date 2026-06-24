/**
 * bgSubjects.ts — programmatic SEO data for the background remover.
 *
 * Each entry generates a dedicated landing page at:
 *   /remove-background-from-{slug}
 * targeting a specific high-intent search query. Same on-device tool,
 * tailored copy.
 */

export interface BgSubject {
  /** URL slug → /remove-background-from-{slug} */
  slug: string;
  /** Natural noun phrase, e.g. "a logo". */
  noun: string;
  /** Page <h1>. */
  h1: string;
  /** <title> tag. */
  title: string;
  /** Meta description. */
  description: string;
  /** Intro paragraph under the tool. */
  intro: string;
  /** 3 short, subject-specific tips. */
  tips: string[];
}

export const BG_SUBJECTS: BgSubject[] = [
  {
    slug: "logo",
    noun: "a logo",
    h1: "Remove the Background From a Logo",
    title: "Remove Background From Logo — Free Transparent PNG | ZeroUpload",
    description:
      "Make a logo background transparent in seconds. 100% in your browser — no upload, no signup, no watermark. Download a clean transparent PNG.",
    intro:
      "Drop your logo and get a clean transparent PNG you can place on any colour, website, or document. Perfect for watermarks, headers, and merch — and your logo never leaves your device.",
    tips: [
      "Start from the highest-resolution version of your logo for the crispest edges.",
      "PNG keeps full transparency — use it anywhere a background would clash.",
      "Logos with solid shapes cut out beautifully; thin outlines may need a higher-res source.",
    ],
  },
  {
    slug: "signature",
    noun: "a signature",
    h1: "Remove the Background From a Signature",
    title: "Remove Background From Signature — Transparent PNG Free | ZeroUpload",
    description:
      "Turn a photo of your signature into a clean transparent PNG for documents and contracts. Private, in-browser, no upload, no signup.",
    intro:
      "Snap or scan your signature, drop it here, and get a transparent PNG you can drop straight into PDFs and contracts. Because it runs on your device, your signature is never uploaded anywhere.",
    tips: [
      "Sign with a dark pen on plain white paper for the cleanest cut-out.",
      "Good, even lighting avoids shadows being mistaken for ink.",
      "The transparent PNG layers perfectly over any document background.",
    ],
  },
  {
    slug: "product-photo",
    noun: "a product photo",
    h1: "Remove the Background From a Product Photo",
    title: "Remove Background From Product Photos — Free for Sellers | ZeroUpload",
    description:
      "Get clean white-or-transparent product photos for eBay, Etsy, Amazon, Shopify and Depop. Unlimited, free, private — no upload, no per-image fee.",
    intro:
      "Selling online? Drop your product shots and get clean transparent cut-outs ready for any marketplace. Batch as many as you like — there's no per-image fee because nothing is uploaded to a server.",
    tips: [
      "Shoot against a plain, contrasting background for the sharpest edges.",
      "Drop several photos at once — they process one after another on your device.",
      "Place the transparent PNG on pure white for classic marketplace listings.",
    ],
  },
  {
    slug: "portrait",
    noun: "a portrait",
    h1: "Remove the Background From a Portrait",
    title: "Remove Background From a Portrait Photo — Free | ZeroUpload",
    description:
      "Cut out the background from a portrait or photo of a person, keeping hair detail. Free, private, in-browser — no upload and no signup.",
    intro:
      "Drop a portrait and the subject is lifted cleanly from the background, hair and all. Everything happens on your device, so the photo is never sent anywhere.",
    tips: [
      "Even lighting on the face and hair gives the most natural edges.",
      "A bit of contrast between subject and background helps the AI most.",
      "Download as PNG to keep soft, transparent hair edges intact.",
    ],
  },
  {
    slug: "profile-picture",
    noun: "a profile picture",
    h1: "Remove the Background From a Profile Picture",
    title: "Remove Background From Profile Picture — Free PNG | ZeroUpload",
    description:
      "Make a clean profile picture for LinkedIn, Instagram, Discord or a CV. Transparent or solid colour, free and private — nothing is uploaded.",
    intro:
      "Drop your photo to get a crisp, distraction-free profile picture for any platform. It all runs in your browser, so your face never gets uploaded to someone else's server.",
    tips: [
      "Face the light for a clean, even cut-out.",
      "Save as PNG for transparency, then drop it on any brand colour you like.",
      "Great for matching headshots across a whole team.",
    ],
  },
  {
    slug: "headshot",
    noun: "a headshot",
    h1: "Remove the Background From a Headshot",
    title: "Remove Background From Headshot — Free Transparent PNG | ZeroUpload",
    description:
      "Professional headshot background removal in your browser. Replace busy backgrounds with clean transparency. Free, unlimited, no upload, no signup.",
    intro:
      "Turn a casual headshot into a clean, professional one by lifting away the background. Private by design — the image is processed entirely on your device.",
    tips: [
      "Higher resolution headshots keep sharp detail around the hairline.",
      "Use the transparent PNG over a neutral grey or brand colour for a studio look.",
      "Batch a whole team's headshots for a consistent directory.",
    ],
  },
  {
    slug: "pet",
    noun: "a pet photo",
    h1: "Remove the Background From a Pet Photo",
    title: "Remove Background From Pet Photos — Free & Private | ZeroUpload",
    description:
      "Cut out your cat, dog or any pet from its background for stickers, prints and memes. Free, in-browser, no upload required.",
    intro:
      "Drop a photo of your pet and lift them cleanly from the background — perfect for stickers, prints, and gifts. Fluffy edges and all, processed right on your device.",
    tips: [
      "A still, well-lit pet gives the cleanest fur edges.",
      "Contrast between the pet and the floor or wall helps a lot.",
      "Save as PNG to keep that soft, fuzzy outline.",
    ],
  },
  {
    slug: "car",
    noun: "a car photo",
    h1: "Remove the Background From a Car Photo",
    title: "Remove Background From Car Photos — Free for Listings | ZeroUpload",
    description:
      "Clean up car photos for dealership listings and marketplaces. Remove the background free, in your browser — no upload, no limits.",
    intro:
      "Selling a vehicle? Drop your car photos to get clean cut-outs for listings and ads. Process your whole gallery for free — nothing is uploaded.",
    tips: [
      "Shoot the car against an uncluttered background for the cleanest result.",
      "Place the cut-out on a clean studio-grey backdrop for a premium listing look.",
      "Higher resolution keeps wheels and trim sharp.",
    ],
  },
  {
    slug: "screenshot",
    noun: "a screenshot",
    h1: "Remove the Background From a Screenshot",
    title: "Remove Background From a Screenshot — Free PNG | ZeroUpload",
    description:
      "Isolate an object or subject from a screenshot and export a transparent PNG. Free, private, in your browser — no upload needed.",
    intro:
      "Drop a screenshot to lift the main subject onto a transparent background. Handy for slides, docs, and mock-ups — and it all stays on your device.",
    tips: [
      "Crop close to the subject first for the most accurate cut-out.",
      "Transparent PNGs drop cleanly into slide decks and docs.",
      "Higher-resolution screenshots produce sharper edges.",
    ],
  },
  {
    slug: "id-photo",
    noun: "an ID photo",
    h1: "Remove the Background From an ID Photo",
    title: "Remove Background From ID / Passport Photo — Free | ZeroUpload",
    description:
      "Create a clean white or transparent background for passport and ID photos. 100% private and in-browser — your photo is never uploaded.",
    intro:
      "Drop your photo to get the clean, plain background that ID and passport pictures require. Privacy matters here most — your photo never leaves your browser.",
    tips: [
      "Face the camera straight on with even lighting, as ID rules require.",
      "Export the transparent PNG, then place it on solid white.",
      "Check your specific document's size and background colour requirements.",
    ],
  },
  {
    slug: "sticker",
    noun: "a sticker",
    h1: "Make a Sticker — Remove the Background",
    title: "Make a Sticker — Remove Background Free Online | ZeroUpload",
    description:
      "Turn any photo into a sticker by removing the background. Free, unlimited, in your browser — no upload, no watermark, no signup.",
    intro:
      "Drop a photo to instantly turn it into a transparent sticker for chats, prints, and decals. Make as many as you want — it's all free and on-device.",
    tips: [
      "Subjects with clear outlines make the punchiest stickers.",
      "Add a white outline in any editor after exporting for the classic sticker look.",
      "PNG keeps the edges clean on any chat background.",
    ],
  },
  {
    slug: "clothing",
    noun: "clothing",
    h1: "Remove the Background From Clothing Photos",
    title: "Remove Background From Clothing — Free for Resellers | ZeroUpload",
    description:
      "Clean ghost-mannequin style cut-outs for clothing on Depop, Vinted and Etsy. Free, private background removal in your browser — no upload.",
    intro:
      "Reselling clothes? Drop your photos to get clean cut-outs that make listings pop. Batch your whole wardrobe for free — nothing is uploaded.",
    tips: [
      "Lay garments flat on a contrasting surface, or use a plain hanger shot.",
      "Place the cut-out on white for a tidy, consistent shop look.",
      "Process a whole batch in one go on your device.",
    ],
  },
];

export const BG_SUBJECT_SLUGS = BG_SUBJECTS.map((s) => s.slug);
