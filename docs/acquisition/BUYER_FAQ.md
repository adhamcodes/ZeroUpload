# ZeroUpload — Buyer FAQ

## Is the product generating revenue?
No. ZeroUpload is pre-revenue and is being offered as a software/IP asset rather than as an established revenue-generating business.

## How much marketing has been done?
No meaningful marketing or distribution campaign has been run. Usage so far has primarily been the owner and a small number of friends/testers after launch.

## Why is it being sold?
The core product is built and launched, but growing it would require sustained distribution/marketing focus. The seller is reallocating development time to other projects and is open to transferring the asset to a buyer who wants to take the product further.

## Are user files uploaded to a processing server?
Supported file operations are designed to run in the browser/on the user's device. The site itself and required application/model assets are downloaded from hosting/CDN infrastructure, but selected files are not sent to a ZeroUpload file-processing backend for the supported local workflows.

## Is there a backend or database to migrate?
No production customer database, authentication backend or server-side file-processing service is part of the current product.

## Does the buyer need the seller's Cloudflare account?
No. The recommended handoff is for the buyer to deploy the transferred repository in the buyer's own Cloudflare/static-hosting account.

## Is a custom domain included?
No. The current product is deployed on a Cloudflare Pages subdomain. A buyer can attach their own domain and rebrand if desired.

## Is the current name required?
No. The codebase can be rebranded. The current `ZeroUpload` branding is not the core value proposition of the acquisition.

## What is included in the sale?
The repository/source code, Git history, interface/product assets contained in the repository, conversion/editing engines, content/landing-page system, PWA/deployment configuration and handoff documentation, subject to the exact final asset agreement.

## Are third-party libraries/models included as owned IP?
No. The application uses third-party open-source software and model assets under their own licenses. Ownership of those third-party projects is not transferred; the buyer receives the seller-owned code/assets plus the right to continue using third-party dependencies according to their respective licenses.

## Has the product been tested?
The owner manually tested the conversion flows before launch. The sale-readiness branch also contains an automated production-build/readiness check that verifies the project can install, build and produce expected product surfaces/assets.

## What operating costs should a buyer expect?
The current static/client-side architecture avoids a dedicated file-processing backend and paid inference API for current functionality. Actual hosting/bandwidth/domain/analytics/advertising costs depend on the buyer's chosen providers and future traffic.

## Will the seller help after the sale?
A recommended default is up to 14 days of reasonable transition support for deployment and architecture questions. New feature development is not included unless separately agreed.
