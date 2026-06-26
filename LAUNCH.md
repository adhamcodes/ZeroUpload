# 🚀 ZeroUpload — Launch Guide

Everything below is **optional and OFF by default**. The site works perfectly
without any of it. Do these steps when you're ready to go live and earn.

All switches live in one file: **`src/lib/siteConfig.ts`**.

---

## 1. Connect a domain (e.g. `zeroupload.app`)

> Hosting is already done & free on Cloudflare Pages. You only buy the domain.

1. Buy the domain (Cloudflare Registrar is cheapest — at cost). Decline every
   upsell (hosting, site builder, SSL, email — you don't need them).
2. Cloudflare dashboard → **Workers & Pages → ZeroUpload → Custom domains →
   Set up a custom domain** → type `zeroupload.app` → follow the prompts.
3. Cloudflare auto-creates the DNS record + free HTTPS. Done in minutes.
4. In `src/lib/siteConfig.ts`, set `url` to `https://zeroupload.app`.
   (Also update `site` in `astro.config.mjs` if it's hard-coded there.)
5. Turn on **auto-renew** for the domain so you never lose it.

---

## 2. Turn on analytics (count your visits) — privacy-first & free

1. Cloudflare dashboard → **Analytics & Logs → Web Analytics → Add a site**.
2. Copy the **beacon token**.
3. Paste it into `src/lib/siteConfig.ts` → `cloudflareAnalyticsToken`.
4. Commit & deploy. It's cookieless — no consent banner needed.

---

## 3. Turn on ads (the money) — after launch

> AdSense only approves a **real, live domain with some content/traffic**, so
> do this after step 1 and after sharing the site a bit.

1. Create a Google AdSense account, add `zeroupload.app`, and complete their
   review (can take days).
2. Once approved, copy your **publisher id** (`ca-pub-XXXXXXXXXXXXXXXX`).
3. Paste it into `src/lib/siteConfig.ts` → `adsensePublisherId`.
4. Deploy. The AdSense loader + a footer ad slot switch on automatically.
   (Enable **Auto ads** in the AdSense dashboard for hands-off placement.)

---

## 4. Get found on Google

1. [Google Search Console](https://search.google.com/search-console) → add
   your domain → verify (Cloudflare makes this one click).
2. Submit the sitemap: `https://zeroupload.app/sitemap-index.xml`.
3. Google will start indexing all ~100 tool & conversion pages.

---

## The honest timeline
Ad revenue is a **slow compounding game** — traffic builds over weeks/months as
Google ranks the pages. Tools + SEO pages are the engine; the domain, analytics,
and ads are the pipes. Be patient, keep sharing, keep adding tools.
