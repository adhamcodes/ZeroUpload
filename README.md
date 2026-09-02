# ZeroUpload

**Convert, compress, and edit your files in the browser. Your files are not uploaded for processing.**

Most online converters send your files to a server before they can do anything with them. ZeroUpload takes a different approach: supported conversions and edits run on your device, inside your browser. Cloudflare serves the website itself, but your selected files are not sent to a file-processing backend.

🔗 **Live:** https://zeroupload-8e8.pages.dev

---

## What it does

- **Images** — convert between PNG, JPG, WEBP, HEIC, GIF, BMP and SVG; compress,
  resize, rotate and flip.
- **AI Background Remover** — erase a background on-device.
- **PDF** — convert to/from images, merge, split, rotate, compress, reorder/delete
  pages, and extract text.
- **Audio** — convert MP3, WAV, OGG, M4A, FLAC, AAC; trim, merge and compress.
- **Image → Text (OCR)** — pull text out of a screenshot or photo.

No signup, watermark, or server-side usage quota.

## Why it's different

- **Private by design.** Your selected files stay on your device instead of being uploaded for processing.
- **No account required.** Open a tool and use it without creating an account.
- **Local processing.** The work runs on your own hardware, so there is no upload queue before processing starts.
- **Works across modern browsers.** Use it on desktop or mobile, and install it as a PWA where supported.

## How it works

ZeroUpload is hosted as a static web app. The site code and assets are served by
Cloudflare Pages, while supported file operations run locally using browser APIs,
WebAssembly, and Canvas. There is no file-processing backend or database receiving
your selected files.

For a simple check, start a supported conversion after the page has loaded and
turn off your connection. The conversion can still finish because the file work is
happening on your device.

## Built with

[Astro](https://astro.build), [React](https://react.dev) and
[Tailwind CSS](https://tailwindcss.com), deployed on
[Cloudflare Pages](https://pages.cloudflare.com). File processing is client-side.

## About

ZeroUpload is an independent, privacy-first project built by **Adham**.

Questions or ideas? **support@zeroupload.app**
