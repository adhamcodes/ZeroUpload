# ZeroUpload — Acquisition Overview

## Product
ZeroUpload is a privacy-first browser file toolkit. Supported file operations run on the user's device instead of uploading the selected file to a file-processing backend.

Current live demo: https://zeroupload-8e8.pages.dev/

## Current status
- Production deployment is live on Cloudflare Pages.
- Pre-revenue.
- No meaningful marketing or distribution has been performed.
- Usage to date is primarily the owner and a small number of friends/testers.
- The product is being offered as a software/IP asset, not as an established revenue-generating business.

## What is included
- Image conversion and editing tools.
- PDF conversion and management tools.
- Audio conversion/editing using browser-side ffmpeg.wasm.
- OCR using browser-side tooling.
- On-device AI background removal.
- PWA/installable web-app assets.
- Programmatic landing-page architecture for supported conversion pairs and background-removal intents.
- Source code, Git history, UI/design assets, deployment configuration and acquisition/handoff documentation.

## Architecture at a glance
- Astro + React + TypeScript + Tailwind CSS.
- Static deployment model.
- No customer database.
- No authentication system.
- No paid inference API required for the current background-removal feature.
- No server-side file-processing backend.

## Buyer profile
ZeroUpload is most suitable for a buyer who wants a finished browser utility platform they can rebrand, market, monetize, localize, extend or integrate into a broader file-tools portfolio.

## Important disclosure
No custom domain is included. The current Cloudflare Pages URL is a live demo/deployment endpoint; a buyer can deploy the transferred repository to their own hosting account and domain.
