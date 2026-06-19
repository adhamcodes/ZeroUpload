# TUTORIAL — Build, edit & deploy ZeroUpload

A step-by-step, beginner-friendly guide. If you've never touched this kind of
project before, follow it top to bottom.

---

## 1. What you need

- **Node.js 18+** (we built and tested on Node 22).
- A terminal.
- That's it. No database, no server, no API keys.

## 2. Get it running locally

```bash
# install dependencies (only needed once, or after package.json changes)
npm install

# start the dev server with hot reload
npm run dev
```

Then open the URL it prints (usually `http://localhost:4321`).

To make a production build and preview it exactly as users will see it:

```bash
npm run build     # outputs static files to /dist
npm run preview   # serves the built /dist locally
```

## 3. How the project is organised

```
ZeroUpload/
├─ astro.config.mjs        # site URL + integrations (react, sitemap, tailwind)
├─ src/
│  ├─ data/conversions.ts  # THE BRAIN: all formats + conversion pairs + SEO copy
│  ├─ lib/convertImage.ts  # the in-browser Canvas conversion engine
│  ├─ components/
│  │  ├─ Converter.tsx      # the interactive drag-drop widget (React island)
│  │  ├─ Header.astro
│  │  └─ Footer.astro
│  ├─ layouts/Layout.astro  # shared <head> (SEO, fonts, JSON-LD), header+footer
│  ├─ pages/
│  │  ├─ index.astro              # homepage
│  │  ├─ image-converter.astro    # category hub
│  │  └─ [from]-to-[to].astro     # generates ALL conversion pages
│  └─ styles/global.css     # Quiet Luxury design tokens
└─ public/                  # favicon, robots.txt (served as-is)
```

## 4. The most important idea: programmatic SEO

We never write conversion pages by hand. Instead:

1. `src/data/conversions.ts` lists the **formats** and which ones we can
   read (`canDecode`) and write (`canEncode`).
2. A function auto-builds every valid `from → to` **pair**.
3. `src/pages/[from]-to-[to].astro` uses Astro's `getStaticPaths()` to turn each
   pair into its own static HTML page at build time — with a unique title, meta
   description, H1, how-to steps, FAQ, and Google rich-snippet JSON-LD.

**So to launch 50 new keyword pages, you edit ONE data file.** That's the whole
SEO engine.

### Add a new image format (example)

In `src/data/conversions.ts`, add to the `FORMATS` array:

```ts
{
  id: "tiff",
  name: "TIFF",
  fullName: "Tagged Image File Format",
  category: "image",
  mime: "image/tiff",
  blurb: "a high-quality format used in photography and printing",
  canDecode: true,   // can the engine READ it?
  canEncode: false,  // can the engine WRITE it?
}
```

Run `npm run build` and every valid new page (`tiff-to-png`, `tiff-to-jpg`, …)
appears automatically.

## 5. How a conversion actually works (no server!)

`src/lib/convertImage.ts`:

1. Reads the user's file into an image bitmap **in the browser**.
2. Draws it onto an HTML `<canvas>`.
3. Exports the canvas to the target format with `canvas.toBlob()`.
4. Hands back a downloadable file.

The file is never sent anywhere. Open DevTools → Network tab and you'll see
**zero upload requests**. That's the product's whole promise, provable.

## 6. Editing the look (Quiet Luxury)

All colours, fonts, radius and shadow live as tokens in
`src/styles/global.css` under `@theme`. Change them once and the whole site
updates. Tailwind utility classes (e.g. `bg-paper`, `text-stone`, `font-display`)
map to those tokens.

## 7. Deploy to Cloudflare Pages (free, unlimited bandwidth)

1. Push the repo to GitHub (already done).
2. Go to **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to
   Git** and pick the `ZeroUpload` repo.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**. Cloudflare gives you a free
   `*.pages.dev` URL immediately.
5. When you buy the real domain, add it under **Custom domains**, then update:
   - `site` in `astro.config.mjs`
   - the `Sitemap:` line in `public/robots.txt`

## 8. After deploying — turn on the traffic

1. Add the site to **Google Search Console** and **Bing Webmaster Tools**.
2. Submit `https://YOURDOMAIN/sitemap-index.xml`.
3. Google will start indexing the conversion pages. Traffic compounds from there.

## 9. Common gotchas

- **Build fails after editing `conversions.ts`?** Check that every format object
  has all required fields and valid commas.
- **A target format produces nothing?** Canvas can only encode PNG/JPG/WEBP. Keep
  exotic formats as `canEncode: false` (sources only) until a WASM engine is added.
- **Want HEIC/PDF/audio?** Those need dedicated engines — see `roadmap.md`
  Phases 1–3.
