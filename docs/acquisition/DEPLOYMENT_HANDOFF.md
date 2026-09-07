# ZeroUpload — Deployment & Handoff

## Fresh local build

Requirements:
- Node.js 20+ recommended.
- npm.

Commands:

```bash
npm ci
npm run build
```

`npm run build` runs the project's prebuild step, which prepares the self-hosted ffmpeg assets, then builds the Astro site.

The generated static site is written to `dist/`.

## Local preview

```bash
npm run preview
```

## Deploying to Cloudflare Pages

Recommended buyer flow:
1. Transfer or clone the repository into the buyer's GitHub account/organization.
2. In the buyer's Cloudflare account, create a new Pages project connected to the repository.
3. Use `npm run build` as the build command.
4. Use `dist` as the output directory.
5. Deploy.
6. Attach the buyer's own custom domain if desired.
7. Replace the production URL in `astro.config.mjs` and `src/lib/siteConfig.ts` when moving to a buyer-owned domain.

## Optional production switches
`src/lib/siteConfig.ts` contains the current production URL plus disabled integration points for Cloudflare Web Analytics and Google AdSense. A buyer can configure those values if desired.

## What does not need migration
There is currently no:
- production customer database,
- user-authentication system,
- billing database,
- server-side file-processing service,
- paid AI inference account required for current functionality.

## Recommended transfer sequence
1. Buyer confirms final asset list.
2. Transaction funds are secured through the agreed payment/escrow mechanism.
3. Repository/software assets are transferred to the buyer.
4. Buyer creates a fresh deployment in their own hosting account.
5. Buyer verifies representative tools and the production build.
6. Seller provides reasonable transition assistance for the agreed support window.

## Support boundary
A reasonable default offer is up to 14 days of transition assistance for deployment and architecture questions. New product features, redesigns or unrelated development are outside normal handoff support unless separately agreed.
