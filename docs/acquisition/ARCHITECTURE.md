# ZeroUpload — Architecture Summary

## Overview
ZeroUpload is a static browser application designed so supported file operations execute on the user's device rather than through a file-processing backend.

## Front end
- Astro provides the static site/application structure and page generation.
- React powers interactive tools.
- TypeScript is used across the application logic.
- Tailwind CSS provides styling.

## Processing engines

### Images
Browser APIs/Canvas handle supported raster conversion and editing. HEIC/HEIF support is provided through a dedicated browser-side library.

### PDFs
PDF operations use browser-side PDF libraries for reading, writing, converting and editing documents.

### Audio
Audio conversion/editing uses ffmpeg.wasm. The ffmpeg core is served with the site and loaded into the browser; selected audio files are processed in the browser runtime.

### OCR
OCR runs in the browser using the project's OCR dependency.

### Background removal
The background-removal workflow uses Transformers.js with an on-device model/WASM inference path. Model weights are fetched when required and cached by the browser; selected user images are not sent to a ZeroUpload file-processing backend.

## Hosting
The current public deployment uses Cloudflare Pages. Because the application is static, the buyer can deploy the transferred repository to another compatible static host as well.

## State and infrastructure
- No user-account system.
- No customer database.
- No application backend for file processing.
- No paid external AI inference API required by the current product.
- Analytics and advertising integration points exist in configuration but are disabled unless configured.

## SEO/page-generation architecture
A central conversion catalog defines supported formats and conversion pairs. Astro uses that data to generate dedicated static pages at build time. Separate data powers dedicated background-removal intent pages. This structure makes the product extensible without hand-authoring every landing page.

## Operational implication for a buyer
The product is comparatively simple to transfer because the buyer primarily needs the repository, a Node.js build environment, and a static hosting account. There is no production database or customer-authentication infrastructure to migrate.
