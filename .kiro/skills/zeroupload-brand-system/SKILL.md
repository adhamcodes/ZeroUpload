---
name: zeroupload-brand-system
description: The brand system and product rules for ZeroUpload (the 100%-in-browser file converter). Use on EVERY page/component to keep the "Quiet Luxury" look, the UX flow, the company motto, and the mandatory technical requirements consistent. Defines design tokens, voice, the category-hub IA, and the non-negotiable constraints.
---

# ZeroUpload — Brand System & Product Rules

The source of truth for how ZeroUpload looks, feels, and behaves. Pair with `frontend-design-principles` and `client-side-conversion-playbook`.

## 🏛️ COMPANY MOTTO (the brand line — the promise we sell)

> ## "Your Files Are Nobody's Business."

This is the official public motto. It's the *feeling* and the promise. Lead with
it in the hero, the About page, and the brand voice. (It already lives on the
homepage and in the privacy policy — keep it consistent everywhere.)
Supporting tagline/descriptor: "Convert files without uploading a thing."

## 🛑 MANDATORY REQUIREMENTS (the non-negotiable HOW — never break)

These technical rules are what *deliver* the motto. They are **requirements**, not
the motto itself. The motto is the promise; these are how we keep it.

- **No upload.** Files never leave the device. Everything runs in-browser (Canvas/WASM).
- **No server. No database. No backend.** Static site only.
- **No external API** for processing user files.
- **No signup. No login. No leaving the page** to do the core task.
- **$0 operating cost.** If a feature can't meet all of the above, it does NOT ship (or ships only as a clearly-labeled experiment that still never uploads).

If a proposed feature violates these requirements, reject it or find an in-browser
alternative. We never break a requirement, because each one protects the motto:
*your files are nobody's business.*

## Brand essence
- Private, instant, unlimited, beautiful.
- Personality: calm, confident, premium, trustworthy. Quiet Luxury — restraint over flash.
- The proof: it works offline. Lean on that everywhere — it's how we *prove* the motto.

## Aesthetic: "Quiet Luxury"
Generous whitespace, refined typography, one restrained accent, soft depth, buttery micro-interactions. Nothing shouts. The drop zone is the hero.

## Design tokens (current system — keep/extend, don't replace)
Defined in `src/styles/global.css` (`@theme`). Current direction:
- `--canvas` off-white `#f7f6f3` · `--paper` `#ffffff` · `--ink` `#14130f`
- `--stone` muted `#6b6860` · `--mist` border `#e7e4dd`
- `--accent` deep refined green `#2f6f4f` · `--accent-soft` `#e8f0ea`
- Fonts: display serif **Fraunces**, body **Inter**. Radius soft (~1.25rem). Shadow: subtle layered.
- One accent only. Warm neutrals. WCAG AA contrast.

## The UX flow (V2 — the upgrade)
The whole point: **drop → pick → done, without hunting.**
- **Category hubs:** `/pdf`, `/image-converter`, `/audio-converter`, `/text` (OCR). Each hub has a clear **"from → to" picker (dropdowns)** so users never search for their format.
- Every conversion still has its own SEO page (`/png-to-jpg` etc.) — the hubs funnel to them; both coexist.
- The converter widget: big drop zone, instant feedback, progress for heavy engines, a clear Download. Privacy reassurance line always visible ("Nothing is uploaded…").
- Keep it one-page: no redirects to do the task.

## Voice & copy
Confident, plain, a little proud of the privacy stance. ✅ "Drop it. It converts on your device. Nothing is uploaded." ❌ hype/exclamation spam. Be honest about limits (e.g., OCR accuracy, animated GIF first-frame). Echo the motto where natural.

## Do / Don't
- ✅ Whitespace, Fraunces headlines, single green accent, calm motion, offline-proof messaging, accessible, fast, the motto front-and-centre.
- ❌ Multiple accents, cluttered tool UI, uploads/servers/signups, hype copy, dark-pattern "pro" walls, anything that betrays a requirement (and therefore the motto).

## The test
Could a competitor copy this without a server? If our feature needs one, we've
broken a requirement — and broken the promise that your files are nobody's
business. Stay in-browser, stay private, stay $0.
