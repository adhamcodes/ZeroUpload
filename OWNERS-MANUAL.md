# ZeroUpload — Owner's Manual & 5-Year Survival Guide

> Written for Adham, the founder, who doesn't write code. This is your "fight
> alone" manual. Keep it. Re-read it whenever you feel lost. Everything here is
> in plain English. You can do this.

---

## 0. Read this first — the big reassurance

ZeroUpload was built on purpose so **one non-technical person can own it for
years with almost no work.** Here's why that's true, not just comforting words:

- **There is no server to crash.** ZeroUpload is a "static site" — a bundle of
  plain files (pages, styles, scripts). It just sits on Cloudflare and gets
  served to visitors. There's no server running your code that can crash, get
  hacked, or need patching at 3 a.m.
- **There is no database.** No user accounts, no stored files, no data to leak,
  back up, or corrupt. Nothing to maintain.
- **It scales for free, automatically.** If you go viral and get a million
  visitors, Cloudflare handles it. You do *nothing*. More traffic does **not**
  mean more work or big bills.
- **It costs about $10–15 per YEAR** — just the domain. Hosting is free forever
  on Cloudflare Pages. No surprise bills.
- **It can run untouched for years.** A static site doesn't "rot." Once it's
  live, it stays live as long as the domain is paid and the accounts are safe.

**So the honest headline: you are not walking into a war. You're maintaining a
vending machine that mostly runs itself.** The rest of this manual is about the
few small things that *do* matter — and they're all easy.

---

## 1. The ONLY things that can actually kill ZeroUpload

There are basically three. All three are 100% preventable, and none require
coding.

### ☠️ Killer #1: The domain expires
If `zeroupload.app` isn't renewed, you lose the name and the site goes dark.
- **Prevention:** Turn ON **auto-renew** at your registrar. Keep a **valid
  payment card** on file. Once a year, log in and confirm both.
- This is the single most important thing in this whole document.

### ☠️ Killer #2: You lose access to your accounts
If you forget your password (or someone hijacks your account) for GitHub,
Cloudflare, or your domain, you can lose control of the site.
- **Prevention:** Turn on **2-factor authentication (2FA)** everywhere, save the
  **recovery/backup codes**, and use a **password manager**. (Section 2.)

### ☠️ Killer #3 (rare, partial): A third-party engine's CDN has a problem
The AI Background Remover, the OCR text tool, and the audio tools borrow their
"engines" from public services (Hugging Face, jsDelivr, ffmpeg). If one of those
ever changes or goes down, *that one tool* might stop loading for a while.
- **Reality check:** This is rare, usually temporary, and **only affects that
  one tool** — the image/PDF converters keep working. It will not take the site
  down. If it happens, note which tool, and get a dev or Kiro to point it at a
  new source (a small fix).

**Everything else you might worry about is either not a real risk, or it's
handled for you by Cloudflare.**

---

## 2. Your accounts — the keys to the kingdom

Losing these is the real danger, not the code. Lock them down once, sleep easy.

**The accounts that matter:**
1. **The email address** behind everything (this is the master key — protect it most).
2. **GitHub** (`adhamcodes`) — holds the source code.
3. **Cloudflare** — hosting, the domain, analytics.
4. **Google** — AdSense (money) + Search Console (SEO), once you set those up.
5. **A password manager** (Bitwarden is free and excellent; 1Password is great too).

**Do this once, for every account above:**
- [ ] Set a **strong, unique password** (let the password manager generate it).
- [ ] Turn on **2-factor authentication (2FA)**.
- [ ] **Save the recovery/backup codes** — store them in your password manager
      AND print a copy on paper kept somewhere safe. These are your "I got locked
      out" lifeline.
- [ ] Make sure your recovery email/phone is current.

If you do only one thing from this manual besides auto-renew, do this.

---

## 3. The TO-DO list (tiny, ongoing — this is all the "maintenance" there is)

**Once a month (5 minutes):**
- [ ] Open the site. Do one conversion (e.g. PNG → JPG). Confirm it works.
- [ ] Glance at your analytics to see visitors (once you've set it up).

**Once a year:**
- [ ] Confirm the domain **auto-renewed** and your card on file is valid.
- [ ] Confirm 2FA still works on your key accounts.

**Whenever it happens:**
- [ ] Reply to genuine support emails (be kind; it builds trust).
- [ ] Ignore/delete phishing emails (Section 5).

That's it. That is the entire ongoing job. No daily work. No code.

---

## 4. The NOT-TO-DO list (how to avoid breaking it yourself)

- ❌ **Don't turn off domain auto-renew.** (Killer #1.)
- ❌ **Don't disable 2FA** or lose your recovery codes.
- ❌ **Don't edit code directly on the `main` branch** if you don't understand it.
      `main` is what's live. If you must try something, do it on a **new branch /
      Pull Request** so `main` stays safe, and have someone check it first.
- ❌ **Don't merge a Pull Request you don't understand** — from anyone, including
      "helpful" strangers. A merged PR goes live automatically.
- ❌ **Don't delete** the GitHub repo, the Cloudflare Pages project, or the DNS
      records. These are the live machine.
- ❌ **Don't click "log in / verify your account" links inside emails.** This is
      how accounts get stolen. Always log in by typing the address yourself.
- ❌ **Don't click your own ads** once AdSense is on — Google bans accounts for
      this. Don't ask friends to click them either.
- ❌ **Don't paste secret keys / passwords into the code** or into public places.
- ❌ **Don't panic-change** `astro.config.mjs` or `src/lib/siteConfig.ts` unless a
      guide (LAUNCH.md) or a dev tells you exactly what to type.

---

## 5. "Something looks broken" — emergency playbook

Stay calm. Work down the list.

**The whole site won't load:**
1. Check the domain hasn't expired (log into your registrar).
2. Check [Cloudflare status](https://www.cloudflarestatus.com) — if Cloudflare
   itself has an outage (very rare), it fixes itself; just wait.
3. Try another browser / your phone on mobile data — it might just be your network.
4. Still down after an hour and domain is fine? Get help (Section 6).

**One tool stopped working (but the site loads):**
- It's almost certainly a temporary third-party engine hiccup (Killer #3).
- Note exactly **which tool** and **what browser**, try again in a few hours.
- If it persists, it's a small fix for a dev or Kiro.

**You got a scary/urgent email ("your account will be deleted!", "verify now!"):**
- It's almost always **phishing**. Do **not** click links.
- If unsure, open a new tab, type the real site (github.com, cloudflare.com)
  yourself, and check there.

**You're locked out of an account:**
- Use your saved **recovery codes** (Section 2). That's exactly what they're for.

---

## 6. How to get help when Kiro (or your subscription) isn't here

**You do NOT need help daily. The site runs itself.** You only need help when you
*want to change something* or if something rare breaks — and both can wait days
or weeks without harm. So don't feel you must keep a subscription running just to
"keep it alive." It stays alive on its own.

When you *do* want help, you have options:

1. **Re-subscribe to Kiro for a short burst** when you have a batch of changes or
   a bug. Get it done, then cancel again. The site doesn't care if you're away.
2. **Hire a freelance web developer** (Fiverr, Upwork) for one-off jobs. The code
   is clean, standard, and documented, so any competent web dev can work on it.
   **Give them:** the GitHub repo link + this manual + the "what to tell a dev"
   box below. Pay per task; you don't need a permanent hire.
3. **Ask an AI assistant** (Kiro, ChatGPT, Claude) to explain an error — paste
   the exact error message and the file, and ask "what does this mean and how do
   I fix it, step by step, I'm not a coder."
4. **Free communities:** the [Astro Discord](https://astro.build/chat) and the
   [Cloudflare Community](https://community.cloudflare.com) are friendly and free.

> **What to tell a developer (copy-paste this):**
> "It's a static site built with **Astro 5 + React islands + Tailwind CSS v4**,
> hosted on **Cloudflare Pages**, auto-deployed from the `main` branch of GitHub
> (`adhamcodes/ZeroUpload`). All file processing runs client-side in the browser
> (no backend, no database). AI/OCR/audio engines load from CDNs
> (`@huggingface/transformers`, `tesseract.js`, `ffmpeg.wasm`). Please work on a
> branch and open a Pull Request; merging to `main` deploys automatically."

That paragraph alone lets any web dev understand your whole project in 30 seconds.

---

## 7. How ZeroUpload works, in plain English (so you're never in the dark)

- **GitHub** = the filing cabinet that stores all the code. Your backup lives here.
- **Cloudflare Pages** = the host. It takes the code from GitHub, builds the site,
  and serves it to the world (for free).
- **The deploy flow:** someone changes code → opens a **Pull Request** → you
  **merge** it on GitHub → Cloudflare automatically rebuilds and the change is
  **live in ~1–2 minutes**. That's the whole pipeline. Nothing manual.
- **Astro / React / Tailwind** = the tools the site is built with. You don't need
  to know them; a dev does.
- **The "engines"** = the clever bits (image/PDF/audio conversion, background
  removal, OCR) that run inside the visitor's browser, on their device. This is
  why files are never uploaded.

**Where the important switches live:**
- `src/lib/siteConfig.ts` — the on/off panel for the domain URL, analytics, and
  ads. (See `LAUNCH.md`.)
- `LAUNCH.md` — click-by-click guide to going live, analytics, and ads.
- `TESTING.md` — how to test every tool + where to get sample files.

---

## 8. Growing it (optional — it earns even if you do nothing)

**Maintaining your Google ranking takes almost no work.** Once your pages rank,
they keep ranking as long as the site stays up and fast — and Cloudflare keeps it
fast automatically. You do **not** have to "feed" it daily.

**If you WANT to grow (all optional):**
- **Share it.** Post on your socials, relevant subreddits, communities. Real
  shares = traffic + backlinks = better ranking. This is the highest-leverage
  thing you can do, and it's free.
- **Add tools occasionally.** More tools = more pages = more search terms you can
  rank for. Do this when you re-subscribe to Kiro or hire a dev. Keep a wishlist.
- **Get backlinks** naturally (other sites linking to you). Being genuinely useful
  earns these over time.

**Don't do shady SEO** — buying links, keyword-stuffing, spammy pages. Google
penalizes it and it can tank your ranking. Slow and honest wins.

**Monetization upkeep (once ads are on):**
- AdSense mostly runs itself ("Auto ads" places them for you).
- Money accumulates and pays out when you pass Google's threshold (e.g. $100).
- **Never click your own ads.** (Repeat from the not-to-do list because it's a
  permanent ban risk.)

---

## 9. The 5-year map (what to expect)

- **Day 1 — Launch:** buy domain, connect it, turn on analytics, submit your
  sitemap to Google Search Console (all in `LAUNCH.md`). Share it.
- **Months 1–6:** Google slowly indexes and ranks your pages. Traffic is small at
  first — **this is normal, don't panic.** Keep sharing. Maybe add a tool or two.
- **Months 6–12:** rankings compound, traffic grows. Apply for AdSense once you
  have steady visits; turn ads on. First revenue trickles in.
- **Year 1–2:** the SEO engine matures; traffic and ad income grow with little
  effort. Do your 5-minute monthly check; renew the domain yearly.
- **Years 2–5:** it largely runs itself. Add tools/share when you feel like
  growing; otherwise it keeps serving people and earning quietly. Re-subscribe to
  Kiro or hire a dev only when you want changes.

**The honest truth about money:** it's a slow compounding game, not a lottery.
Patience + occasional sharing beats daily fretting.

---

## 10. Backups & ownership — you own all of this

- **Your code is safe on GitHub.** That *is* your backup. If your computer dies,
  the project is untouched in the cloud.
- **To keep an extra copy:** on the GitHub repo page, click the green **Code**
  button → **Download ZIP**. Save it somewhere. Do this once after launch and
  maybe yearly.
- **There is no lock-in.** You own the domain, the code, the accounts. You can
  hand the repo to any developer on earth and they can run with it.

---

## 11. Cheat sheet (the facts you'll need)

| Thing | Value |
|---|---|
| **Repo** | `github.com/adhamcodes/ZeroUpload` |
| **Live URL (preview)** | `https://zeroupload-8e8.pages.dev` |
| **Future domain** | `zeroupload.app` |
| **Host** | Cloudflare Pages (free) |
| **Stack** | Astro 5 · React · Tailwind v4 |
| **Backend** | None (everything runs in the browser) |
| **Database** | None |
| **Ongoing cost** | ~$10–15/year (domain only) |
| **Deploy** | Merge to `main` on GitHub → auto-deploys in ~2 min |
| **Switch panel** | `src/lib/siteConfig.ts` |
| **Launch guide** | `LAUNCH.md` |
| **Testing guide** | `TESTING.md` |

---

## A final word

You said you don't know a single line of code, and you're scared of being alone
with this. Here's the honest truth: **the hard part — building it — is done, and
it was built to be low-maintenance precisely because you're solo.** What's left is
not coding. It's: keep the domain paid, keep your accounts locked, share what you
made, and be patient. Those are owner skills, not coder skills — and you already
have them.

If something breaks, it will wait for you. If you want to grow it, help is a
short subscription or a freelancer away. The site will keep running and keep
serving people in the meantime.

You built a real, useful, honest product. Go take care of it like the founder you
are. You've got this. 🫡
