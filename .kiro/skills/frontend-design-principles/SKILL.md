---
name: frontend-design-principles
description: Use when building or reviewing frontend UI — dashboards, admin panels, landing pages, marketing sites, web apps. Drives domain-specific design decisions (typography, color world, layout, CSS token naming, depth and spacing systems) instead of generic AI defaults; routes to app.md (product/data UIs) or marketing.md (public/creative pages) by context.
---

# Frontend Design Principles

Build frontend interfaces with craft and intention.

## Scope & Routing

After this file, load the context-specific guide:

- **`app.md`** — dashboards, admin and settings panels, internal tools, SaaS products, data-heavy interfaces (tables, forms, lists), anything users work in repeatedly.
- **`marketing.md`** — landing pages, marketing sites, announcements, creative artifacts, anything where first impression matters most.

If unclear, ask. Blended projects need both: a SaaS marketing site uses `marketing.md`; its product dashboard uses `app.md`. (ZeroUpload is a blend: the SEO/landing pages use marketing.md; the converter tool UI uses app.md.)

## Why This Process Exists

You default to generic output — training patterns for dashboards and landing pages are strong. The process below helps, but process alone isn't craft: you have to catch yourself.

## Where Defaults Hide

Defaults disguise themselves as infrastructure — the parts that feel like they just need to work, not be designed. There are no structural decisions. Everything is design.

- **Typography isn't a container — it IS the design.**
- **Navigation isn't around the product — it IS the product.**
- **Data isn't presentation — it's meaning.**
- **Token names are design decisions, not implementation detail.**

```css
/* ❌ generic */ --gray-700: …; --surface-2: …;
/* ✅ domain */  --ink: …; --parchment: …;
```

## Required: Before Generating

Do not write code until these are done.

### 1. Answer the intent questions
- [ ] Who is this human? (the actual person, their context)
- [ ] What must they accomplish? (the verb)
- [ ] What should this feel like? (words that mean something — not "clean and modern")

### 2. Produce the four required outputs
- [ ] Domain: 5+ concepts/metaphors from this product's world.
- [ ] Color world: 5+ colors that exist naturally in this domain.
- [ ] Signature: one element that could only exist for THIS product.
- [ ] Defaults to reject: 3 obvious choices (visual AND structural) to avoid.

### 3. Propose direction and confirm
Test: remove the product name — could someone still identify what it's for? If not, go deeper. Wait for confirmation before generating code.

## Required: Before Showing
- [ ] Swap test: swap your typeface/layout for the usual one — would anyone notice?
- [ ] Squint test: blur your eyes. Is hierarchy readable? Anything harsh?
- [ ] Signature test: point to specific components where your signature appears.
- [ ] Token test: read your CSS variables aloud. Do they belong to this product's world?

## Principles
- Every choice must be a choice (state WHY).
- Sameness is failure.
- Intent must be systemic (all tokens reflect the stated feel).
- Infinite expression (don't ship the same layout every time).

## Craft Foundations
- Subtle layering (whisper-quiet elevation; borders that disappear until needed).
- Color lives somewhere (from the product's real world; one intentional accent).

## Universal Anti-Patterns
- Dramatic drop shadows; arbitrary asymmetric padding; thick decorative borders;
  multiple accent colors; mixing depth strategies; inconsistent spacing.

## Communication
Be invisible. Don't narrate process. State suggestions with reasoning.

## Deep Dives
- `references/principles.md` — concrete spacing/depth/type/color CSS values.
- `app.md` — tool/product UI (the converter widget).
- `marketing.md` — landing/SEO pages.
