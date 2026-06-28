# ZeroUpload — Founder's Playbook

> Everything you need to run, launch, grow, and maintain ZeroUpload — in **one
> file**, in plain English, for a non-coder. Jump to the section you need.
> Written for Adham, the founder.

## Contents
1. [The 60-second overview](#1-the-60-second-overview)
2. [Launching it (going live)](#2-launching-it-going-live)
3. [Running it solo — maintenance & survival](#3-running-it-solo--maintenance--survival)
4. [Getting visitors — SEO & growth](#4-getting-visitors--seo--growth)
5. [Testing every tool](#5-testing-every-tool)
6. [Future ideas / wishlist](#6-future-ideas--wishlist)
7. [Cheat sheet](#7-cheat-sheet)

---

## 1. The 60-second overview

**What ZeroUpload is:** a website full of file tools (convert/compress/edit
images, PDFs, audio + AI background removal + OCR) where everything runs in the
visitor's browser. **No server, no database, no uploads.** That design is the
whole point — privacy — and it's also why it's nearly free and easy to maintain.

**Where things live:**
- **Code:** GitHub → `github.com/adhamcodes/ZeroUpload`
- **Hosting:** Cloudflare Pages (free), auto-deploys from the `main` branch
- **The "switch panel":** `src/lib/siteConfig.ts` (domain URL, analytics, ads)

**How a change goes live:** someone edits code → opens a Pull Request → you
**merge** it on GitHub → Cloudflare rebuilds automatically → it's live in ~2
minutes. Nothing manual.

**What it costs to run:** about **$10–15/year** — just the domain. Hosting is free.

---

## 2. Launching it (going live)

Everything below is optional and OFF by default — the site works without any of
it. Do these when you're ready to go public. All switches live in
`src/lib/siteConfig.ts`.

### Step 1 — Connect a domain (e.g. `zeroupload.app`)
1. Buy the domain (Cloudflare Registrar is cheapest — at cost). **Decline every
   upsell** (hosting, email, SSL — you don't need them).
2. Cloudflare dashboard → **Workers & Pages → ZeroUpload → Custom domains → Set
   up a custom domain** → type `zeroupload.app` → follow the prompts. HTTPS is
   automatic.
3. Set `url` in `src/lib/siteConfig.ts` to `https://zeroupload.app` (and `site`
   in `astro.config.mjs`). Ask a dev or Kiro for this 1-line change.
4. **Turn ON auto-renew** for the domain so you never lose it.

### Step 2 — Analytics (free, privacy-first)
1. Cloudflare → **Analytics & Logs → Web Analytics → Add a site**.
2. Copy the **beacon token**, paste it into `siteConfig.ts` →
   `cloudflareAnalyticsToken`. It's cookieless — no consent banner needed.

### Step 3 — Get found on Google
1. [Google Search Console](https://search.google.com/search-console) → add your
   domain → verify (Cloudflare makes it ~1 click).
2. Submit the sitemap: `https://zeroupload.app/sitemap-index.xml`.
3. Repeat at [Bing Webmaster Tools](https://www.bing.com/webmasters) (also powers
   DuckDuckGo).

### Step 4 — Ads (the money) — *after* launch
AdSense only approves a **live domain with some content/traffic**, so do this
after launching and sharing a bit.
1. Create a Google AdSense account, add `zeroupload.app`, complete their review.
2. Once approved, paste your **publisher id** (`ca-pub-…`) into `siteConfig.ts` →
   `adsensePublisherId`. Ads switch on automatically.

> **Honest note:** ad revenue is a slow compounding game. Traffic builds over
> weeks/months. Be patient; keep sharing.

---

## 3. Running it solo — maintenance & survival

**The big reassurance:** ZeroUpload was built so one non-technical person can own
it for years with almost no work. No server to crash, no database to maintain, it
scales for free on Cloudflare, and a static site doesn't "rot." You are
maintaining a vending machine that mostly runs itself.

### The only 3 things that can actually kill it (all preventable)
1. **The domain expires.** → Keep **auto-renew ON** and a **valid card** on file.
   Check once a year. *(This is the #1 thing that matters.)*
2. **You lose access to your accounts.** → Turn on **2-factor authentication
   (2FA)** and **save the recovery codes** for GitHub, Cloudflare, your domain,
   Google, and your email. Use a password manager (Bitwarden is free).
3. **A third-party engine's CDN hiccups** (rare). → This only affects *one* AI
   tool temporarily, never the whole site. If it happens, note which tool and get
   a dev/Kiro to point it at a new source (small fix).

### The tiny to-do list
- **Monthly (5 min):** open the site, do one conversion, glance at analytics.
- **Yearly:** confirm the domain auto-renewed and your card is valid.
- **As needed:** reply to support emails; ignore phishing.

### The not-to-do list
- ❌ Don't turn off domain auto-renew, or disable 2FA.
- ❌ Don't edit code on the `main` branch you don't understand (use a PR; have it checked).
- ❌ Don't merge a Pull Request you don't understand — it goes live automatically.
- ❌ Don't delete the GitHub repo, the Cloudflare project, or DNS records.
- ❌ Don't click "log in / verify" links inside emails (that's how accounts get stolen).
- ❌ Don't click your own ads once AdSense is on (Google bans accounts for it).

### "Something looks broken" — quick playbook
- **Whole site down?** Check the domain hasn't expired → check
  [cloudflarestatus.com](https://www.cloudflarestatus.com) → try another
  browser/phone. Still down after an hour and domain is fine? Get help.
- **One tool broke?** Likely a temporary CDN hiccup. Note which tool + browser,
  try again later. If it persists, it's a small dev fix.
- **Scary "urgent" email?** Almost always phishing. Don't click — log in by
  typing the real address yourself.
- **Locked out?** Use your saved recovery codes.

### Getting help when you don't have a subscription
You don't need help daily — the site runs itself. When you *want* a change or
hit a rare bug:
- **Re-subscribe to Kiro** for a short burst, get it done, cancel again.
- **Hire a freelance web dev** (Fiverr/Upwork) for one-off jobs. Give them this
  repo + the box below.
- **Ask an AI** (Kiro/ChatGPT/Claude) to explain an error — paste it and say "I'm
  not a coder, explain step by step."
- **Free communities:** [Astro Discord](https://astro.build/chat),
  [Cloudflare Community](https://community.cloudflare.com).

> **What to tell a developer (copy-paste):**
> "Static site built with **Astro 5 + React + Tailwind v4**, hosted on
> **Cloudflare Pages**, auto-deployed from the `main` branch of
> `github.com/adhamcodes/ZeroUpload`. All file processing is client-side (no
> backend, no database); AI/OCR/audio engines load from CDNs
> (`@huggingface/transformers`, `tesseract.js`, `ffmpeg.wasm`). Please work on a
> branch and open a Pull Request — merging to `main` auto-deploys."

### Backups & ownership
Your code lives on GitHub — that *is* your backup. For an extra copy: the green
**Code** button → **Download ZIP**. You own the domain, code, and accounts. No
lock-in; any web dev can pick it up.

---

## 4. Getting visitors — SEO & growth

**SEO has 3 ingredients:** ① on-page/technical (✅ already done, top-tier), ②
authority/backlinks (takes time + effort), ③ time + real usage. We maxed out ①.
②and ③ are your job — and they're sharing + patience, not code.

### What's already built in (top-tier on-page SEO)
~100+ keyword-targeted pages (every conversion has its own), unique titles +
descriptions, **structured data (FAQ + app rich results)**, a sitemap, robots.txt,
canonical URLs, social share image, near-perfect speed (static + Cloudflare),
mobile-first, HTTPS, clean URLs, internal linking, and genuinely human-written
content. You start **ahead** of most sites, not behind.

### The honest reality of a new site
A fresh domain has no authority yet, so Google is cautious at first. **Expect a
trickle for the first weeks-to-months — that's normal, not failure.** You escape
the cold start by bringing the first wave of visitors yourself.

### The first 30 days (this is the real work — none of it is code)
Your hook is the **privacy angle**: "edit files without uploading — 100% private."
- **Week 1:** post on all your socials (use the background-remover before/after —
  visuals get shared). Ask friends to share, not just use.
- **Week 1–2:** launch on **Product Hunt** and **Hacker News** ("Show HN"); list
  on **AlternativeTo**, **Indie Hackers**, free-tool directories. These give a
  spike *and* backlinks.
- **Week 2–4:** be genuinely helpful in communities — **r/privacy, r/software,
  r/pdf**, Quora. Answer real questions and mention your free tool. **Read each
  community's rules; help, don't spam.**

### Ongoing growth
Earn backlinks (directories, mentions, being useful). Add tools/articles over
time (more pages = more search terms). Watch Search Console monthly and lean into
what's working. **Consistency beats intensity.**

### What NOT to do
❌ Don't buy backlinks or "SEO packages." ❌ Don't keyword-stuff or mass-generate
junk pages (Google demotes "scaled content"). ❌ Don't spam communities. Honest +
patient wins; shady SEO gets you penalized.

### Timeline (so you don't lose heart)
Weeks 1–4: mostly traffic *you* bring. Months 2–3: Google starts ranking long-tail
searches. Months 4–6: rankings compound if you've earned backlinks. Months 6–12+:
the engine matures and ad revenue gets meaningful. **It's a marathon — most people
quit in month 2, right before it works.**

### If it goes viral
The site handles unlimited traffic automatically (no work, no surprise bills).
When a spike hits, engage and post more — backlinks earned during a spike give a
lasting SEO boost. Have ads on by then so the traffic earns.

---

## 5. Testing every tool

Before launch (and after any change), test on **your phone + every PC browser**
(Chrome, Edge, Firefox, Safari).

**The golden check for every tool:** press **F12 → Network tab**, use the tool,
and confirm **your file is never uploaded** — you should only see the site's own
files load (and, for AI/OCR tools, a one-time engine download from a CDN).

**Where to get test files (free):**
- Images (JPG/PNG/WEBP): phone photos, [Unsplash](https://unsplash.com),
  [Pexels](https://pexels.com). HEIC: any iPhone photo. SVG/BMP/GIF:
  [file-examples.com](https://file-examples.com).
- PDFs: any you own; multi-page + a scanned one from file-examples.com.
- Audio: a phone voice memo, or [filesamples.com](https://filesamples.com).
- OCR: a screenshot of clear text. Background remover: a photo of a person/product.

**Go tool by tool:** confirm it works → the download is correct → no upload in the
Network tab. Note anything broken (tool + browser + what happened) and get it fixed.

> **Heads-up to give testers:** the AI Background Remover and OCR download a small
> one-time engine on first use, so the *first* run is slower, then it's fast. Tell
> them, so they don't think it's broken.

---

## 6. Future ideas / wishlist

You don't *have* to add anything — it earns even if you never touch it. But when
you want to grow, here are sensible directions (do them via Kiro or a freelancer):

- **More tools** (each is a new SEO page): more image effects, PDF→Word-style
  exports *only if it can stay in-browser*, video→GIF, more OCR languages, EXIF
  remover, file hashing, etc. Keep the rule: **must run in the browser, no uploads.**
- **More conversion formats** within existing engines.
- **More articles** (the blog) targeting "how do I convert X to Y" searches.
- **Polish/UX** improvements based on real user feedback.

Keep a running list of ideas here as they come to you. **Golden rule for every
new feature: it must run 100% in the browser — never break the no-upload promise.**

---

## 7. Cheat sheet

| Thing | Value |
|---|---|
| **Repo** | `github.com/adhamcodes/ZeroUpload` |
| **Live (preview)** | `https://zeroupload-8e8.pages.dev` |
| **Future domain** | `zeroupload.app` |
| **Host** | Cloudflare Pages (free) |
| **Stack** | Astro 5 · React · Tailwind v4 |
| **Backend / Database** | None — everything runs in the browser |
| **Ongoing cost** | ~$10–15/year (domain only) |
| **Deploy** | Merge to `main` on GitHub → auto-deploys in ~2 min |
| **Switch panel** | `src/lib/siteConfig.ts` |
| **Support email** | support@zeroupload.app |

---

### A final word
The hard part — building it — is done, and it was built to be low-maintenance
*because* you're solo. What's left isn't coding: keep the domain paid, keep your
accounts locked, share what you made, and be patient. Those are owner skills, and
you already have them. You've got this. 🫡
