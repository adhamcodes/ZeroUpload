---
name: zeroupload-brand-system
description: The brand system and product rules for ZeroUpload (the 100%-in-browser file converter). Use on EVERY page/component to keep the "Quiet Luxury" look, the UX flow, and the sacred privacy motto consistent. Defines design tokens, voice, the category-hub IA, and the non-negotiable constraints.
---

# ZeroUpload — Brand System & Product Rules

The source of truth for how ZeroUpload looks, feels, and behaves. Pair with `frontend-design-principles` and `client-side-conversion-playbook`.

## 🛑 THE SACRED MOTTO (never break — this IS the product)
- **No upload.** Files never leave the device. Everything runs in-browser (Canvas/WASM).
- **No server. No database. No backend.** Static site only.
- **No external API** for processing user files.
- **No signup. No login. No leaving the page** to do the core task.
- **$0 operating cost.** If a feature can't meet all of the above, it does NOT ship (or ships only as a clearly-labeled experiment that still never uploads).

If a proposed feature violates the motto, reject it or find an in-browser alternative. The name is the promise.

## Brand essence
- Private, instant, unlimited, beautiful. "Convert files without uploading a thing."
- Personality: calm, confident, premium, trustworthy. Quiet Luxury — restraint over flash.
- The proof: it works offline. Lean on that everywhere.

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
Confident, plain, a little proud of the privacy stance. ✅ "Drop it. It converts on your device. Nothing is uploaded." ❌ hype/exclamation spam. Be honest about limits (e.g., OCR accuracy, animated GIF first-frame).

## Do / Don't
- ✅ Whitespace, Fraunces headlines, single green accent, calm motion, offline-proof messaging, accessible, fast.
- ❌ Multiple accents, cluttered tool UI, uploads/servers/signups, hype copy, dark-pattern "pro" walls, anything that betrays the motto.

## The test
Could a competitor copy this without a server? If our feature needs one, we've left the motto. Stay in-browser, stay private, stay $0.
