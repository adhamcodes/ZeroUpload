# ZeroUpload — Third-Party Dependency Notes

This document is a practical acquisition inventory, not legal advice. A buyer should preserve applicable notices/licenses and re-check the exact dependency tree used at closing.

## Direct runtime dependencies

| Package | Version range in project | Primary purpose | License |
|---|---:|---|---|
| `astro` | `^5.2.0` | Static application framework | MIT |
| `@astrojs/react` | `^4.2.0` | React integration for Astro | MIT-family project dependency; verify exact package notice at closing |
| `@astrojs/sitemap` | `^3.2.1` | Sitemap generation | MIT-family project dependency; verify exact package notice at closing |
| `react` | `^19.0.0` | Interactive UI | MIT |
| `react-dom` | `^19.0.0` | React DOM renderer | MIT |
| `tailwindcss` | `^4.0.0` | Styling | MIT |
| `@tailwindcss/vite` | `^4.0.0` | Tailwind/Vite integration | MIT-family project dependency; verify exact package notice at closing |
| `@ffmpeg/ffmpeg` | `^0.12.15` | Browser-side ffmpeg wrapper | MIT |
| `@ffmpeg/util` | `^0.12.2` | ffmpeg browser utilities | Verify exact package notice at closing |
| `@huggingface/transformers` | `^4.2.0` | Browser ML inference | Apache-2.0 |
| `heic-to` | `^1.5.2` | HEIC/HEIF browser conversion | LGPL-3.0 |
| `marked` | `^15.0.0` | Markdown rendering for project content | MIT |
| `pdf-lib` | `^1.17.1` | PDF creation/editing | MIT |
| `pdfjs-dist` | `^6.0.227` | PDF parsing/rendering | Apache-2.0 |
| `tesseract.js` | `^7.0.0` | Browser OCR | Apache-2.0 |

## Development dependency of note
- `@ffmpeg/core` is used to prepare the self-hosted ffmpeg core assets. The final ffmpeg distribution can include additional codec/library licensing considerations beyond the JavaScript wrapper itself. Preserve upstream notices and verify redistribution obligations for the exact bundled build before closing.

## Background-removal model
The current implementation identifies `Xenova/modnet` as the browser model used for background removal and documents it as Apache-2.0 in the source. Model files remain third-party assets under their own terms; they are not seller-owned IP.

## Acquisition treatment
The seller transfers seller-owned application code, product copy and assets. Third-party libraries/models are not sold as proprietary IP and remain governed by their own licenses.

## Closing checklist
Before final transfer:
1. Run a fresh dependency/license inventory against the exact closing commit.
2. Preserve required copyright/license notices.
3. Re-check LGPL obligations around the `heic-to`/libheif distribution path.
4. Re-check the exact ffmpeg core/codecs distributed with the production build.
5. Do not represent third-party libraries or model weights as exclusively owned by the seller.
