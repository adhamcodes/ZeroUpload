---
name: zeroupload-brand-system
description: The brand system and product rules for ZeroUpload (the 100%-in-browser file converter). Use on EVERY page/component to keep the "Atelier" look, the UX flow, the company motto, and the mandatory technical requirements consistent. Defines design tokens, voice, the category-hub IA, and the non-negotiable constraints.
---

# ZeroUpload — Brand System & Product Rules

The source of truth for how ZeroUpload looks, feels, and behaves. Pair with `frontend-design-principles` and `client-side-conversion-playbook`.

## COMPANY MOTTO (the brand line -- the promise we sell)

> ## "Your Files Are Nobody's Business."

This is the official public motto. It is the *feeling* and the promise. Lead with
it in the hero, the About page, and the brand voice. (It already lives on the
homepage and in the privacy policy -- keep it consistent everywhere.)
Supporting tagline/descriptor: "Convert files without uploading a thing."

## MANDATORY REQUIREMENTS (the non-negotiable HOW -- never break)

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
- Personality: calm, confident, premium, trustworthy. Atelier -- restraint over flash.
- The proof: it works offline. Lean on that everywhere -- it is how we *prove* the motto.

## Aesthetic: "Atelier"
Generous whitespace, refined typography, warm neutrals with a single restrained green accent, a rare brass highlight for special moments, soft depth, and buttery micro-interactions. Nothing shouts. The drop zone is the hero. Think of a well-lit workshop where precision tools sit quietly on warm wood.

---

## Design tokens

Defined in `src/styles/global.css` (`@theme` block). Tailwind v4 CSS-first config turns these into utility classes (e.g., `bg-canvas`, `text-ink`, `border-mist`).

### Porcelain palette (light -- default)

| Token            | oklch value                | Approx hex | Usage                              |
|------------------|----------------------------|------------|------------------------------------|
| `--color-canvas` | `oklch(96% 0.01 80)`      | #F5F3EC    | Page background                    |
| `--color-paper`  | `oklch(100% 0 0)`         | #FFFFFF    | Elevated surfaces, cards           |
| `--color-ink`    | `oklch(15% 0.02 70)`      | #17150F    | Primary text                       |
| `--color-stone`  | `oklch(50% 0.02 70)`      | #6E685C    | Secondary/muted text               |
| `--color-mist`   | `oklch(91% 0.02 80)`      | #E7E2D6    | Borders, dividers                  |
| `--color-surface`| `oklch(100% 0 0)`         | #FFFFFF    | Same as paper in light mode        |
| `--color-accent` | `oklch(37% 0.08 165)`     | #15543E    | Pine green -- primary accent       |
| `--color-accent-soft` | `oklch(94% 0.02 155)` | #E4EDE7   | Accent background tint             |
| `--color-brass`  | `oklch(66% 0.12 70)`      | #B98A3E    | Rare highlight (see Brass rules)   |
| `--color-brass-soft` | `oklch(92% 0.03 80)`  | #EDE5D4    | Hover backgrounds for brass items  |

### Vault palette (dark -- via `[data-theme="dark"]`)

| Token            | oklch value                | Approx hex | Change from Porcelain             |
|------------------|----------------------------|------------|-----------------------------------|
| `--color-canvas` | `oklch(12% 0.02 70)`      | #14130F    | Deep warm black                   |
| `--color-surface`| `oklch(15% 0.02 70)`      | #1C1B16    | Elevated surfaces                 |
| `--color-paper`  | `oklch(15% 0.02 70)`      | #1C1B16    | Cards sit on surface              |
| `--color-ink`    | `oklch(95% 0.01 80)`      | #F2EFE6    | Light text on dark                |
| `--color-stone`  | `oklch(65% 0.02 70)`      | #9E9789    | Muted text, lighter than light    |
| `--color-mist`   | `oklch(25% 0.02 70)`      | #3A3830    | Subtle dark borders               |
| `--color-accent` | `oklch(78% 0.14 165)`     | #5FD0A0    | Mint glow -- brighter for dark bg |
| `--color-brass`  | same as light              | #B98A3E    | Unchanged                         |

**Vault principle:** borders replace shadows. Shadows are reduced to near-zero in dark mode; use `border-mist` for depth separation instead.

### Brass rules

Brass (`--color-brass`) is a *rare* highlight color. It adds warmth and delight but **must** be used sparingly:

- **Allowed:** hover underlines on tool cards, step numbers, counters, small decorative accents, occasional icon highlights.
- **Never** for body text at small sizes -- brass on canvas fails WCAG AA contrast.
- **Always** pair brass text with `--color-ink` or `--color-accent` (Pine) for the readable label next to it.
- If in doubt, leave it out. One brass moment per viewport is plenty.

---

## Typography

| Role     | Family         | Use cases                                                                 |
|----------|----------------|---------------------------------------------------------------------------|
| Display  | **Fraunces**   | Headlines, hero text, brand moments. Variable optical-size serif.          |
| Body     | **Geist**      | All body/UI text, navigation, buttons, descriptions. Clean geometric sans.|
| Mono     | **Geist Mono** | Technical readouts: format labels ("PNG"), timings ("done in 142 ms"), file sizes ("2.4 MB"), code snippets. |

Fonts are loaded via Google Fonts `<link>` in `Layout.astro`. Weights: Fraunces 400-700, Geist 400/500/600, Geist Mono 400/500.

Tailwind utilities: `font-display`, `font-sans` (Geist), `font-mono` (Geist Mono).

---

## Signature elements

These are the micro-interactions and visual details that give Atelier its personality:

| Element                | Description                                                                                   |
|------------------------|-----------------------------------------------------------------------------------------------|
| **On-device glow**     | Drop zone idle state: a soft pulsing radial gradient that subtly breathes. Signals "ready."    |
| **Success shimmer**    | Left-to-right sweep animation on conversion complete. Brief, satisfying, then gone.            |
| **Mono timing**        | "done in 142 ms" displayed in Geist Mono. Precision communicates competence.                   |
| **Offline-proof pill** | Animated wifi icon that periodically flashes to wifi-off (3-4 s cycle). Proves the promise.    |
| **Hover-lift**         | Cards translate up 2 px on hover with an elevated shadow (`--shadow-lifted`). Feels physical.  |
| **Brass underline**    | Tool cards gain a 2 px brass bottom-border on hover. Warm, subtle, rewarding.                  |

All animations respect `prefers-reduced-motion: reduce` -- they are disabled or replaced with instant transitions when the user prefers reduced motion.

---

## Dark mode

| Aspect       | Detail                                                                                  |
|--------------|-----------------------------------------------------------------------------------------|
| Toggle       | Sun/moon icon button in the Header. Toggles between light and dark.                     |
| Persistence  | Stored in `localStorage` key `'theme'` (values: `'light'` or `'dark'`).                 |
| Application  | Sets `[data-theme="dark"]` attribute on `<html>`.                                       |
| Fallback     | If no stored preference, falls back to `prefers-color-scheme` media query.              |
| Palette      | Vault (see above). Mint accent glow, warm blacks, same brass.                           |
| Depth model  | Borders over shadows. `--shadow-luxe` and `--shadow-lifted` are near-transparent in dark.|

---

## The UX flow (V2)
The whole point: **drop, pick, done -- without hunting.**
- **Category hubs:** `/image-converter`, `/audio-converter`, `/document-converter`, `/text` (OCR). Each hub has a clear **"from -> to" picker (dropdowns)** so users never search for their format.
- Every conversion still has its own SEO page (`/png-to-jpg` etc.) -- the hubs funnel to them; both coexist.
- The converter widget: big drop zone, instant feedback, progress for heavy engines, a clear Download. Privacy reassurance line always visible ("Nothing is uploaded...").
- Keep it one-page: no redirects to do the task.

## Voice & copy
Confident, plain, a little proud of the privacy stance. "Drop it. It converts on your device. Nothing is uploaded." No hype/exclamation spam. Be honest about limits (e.g., OCR accuracy, animated GIF first-frame). Echo the motto where natural.

## Do / Don't

### Do
- Generous whitespace, Fraunces headlines, Geist body text, Geist Mono for technical bits.
- Single Pine accent with rare Brass highlights.
- Calm motion (glow, shimmer, hover-lift) that respects reduced-motion.
- Offline-proof messaging front and centre.
- Accessible: WCAG AA contrast on all text. Test brass usage carefully.
- Dark mode that works: Vault palette, borders over shadows, mint accent.
- The motto visible on every key page.

### Don't
- Multiple accent colors or rainbow gradients.
- Brass on small body text (contrast failure).
- Cluttered tool UI or dense grids without breathing room.
- Uploads, servers, signups, or anything that betrays a requirement.
- Hype copy, dark-pattern "pro" walls, fake urgency.
- Shadows in dark mode (use borders).
- Animations that ignore `prefers-reduced-motion`.

## The test
Could a competitor copy this without a server? If our feature needs one, we have
broken a requirement -- and broken the promise that your files are nobody's
business. Stay in-browser, stay private, stay $0.
