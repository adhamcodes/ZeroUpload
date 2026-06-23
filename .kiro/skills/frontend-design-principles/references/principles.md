# Technical Principles — concrete values

## Spacing
Base unit 4px or 8px; use multiples. 4 (micro) · 8 (tight) · 12 (standard) · 16 (comfortable) · 24 (generous) · 32+ (major). Every value = "X times base." Symmetrical padding (avoid arbitrary asymmetry).

## Token architecture
Trace every color to primitives: foreground (primary/secondary/muted), background (base/elevated/overlay), border (default/subtle/strong), brand accent, semantic (destructive/warning/success). Don't invent one-off colors.

## Surface elevation
Numbered system (0 base → 4 highest). Differences subtle (a few % lightness), not dramatic. Light mode: higher = lighter or shadow. Dark mode: higher = lighter.

## oklch + color-mix
```css
--accent: oklch(55% 0.18 150);
--accent-hover: color-mix(in oklch, var(--accent), black 10%);
--accent-subtle: color-mix(in oklch, var(--accent), transparent 90%);
```
Lightness 0–100%, chroma 0–~0.4 (UI 0.1–0.25), hue 0–360.

## Text hierarchy (4 levels)
```css
--foreground: oklch(15% 0 0);
--secondary:  oklch(40% 0 0);
--muted:      oklch(55% 0 0);
--faint:      oklch(75% 0 0);
```

## Radius
Pick one system: Sharp (4/6/8) · Soft (8/12/16) · Minimal (2/4/6). Small radius for inputs/buttons, medium for cards, large for modals. Don't mix.

## Depth — choose ONE
Borders-only (flat) · single soft shadow · layered shadows (premium) · surface tints. Don't mix randomly.
```css
--shadow-layered:
  0 0 0 0.5px oklch(0% 0 0 / 0.05),
  0 1px 2px oklch(0% 0 0 / 0.04),
  0 4px 8px oklch(0% 0 0 / 0.02);
```

## Type scale
Display 32/24, body 16/14, small 13/12/11. Headlines 600, tight tracking (-0.02em). Tabular-nums + monospace for numbers/data.

## Animation
150ms micro · 200–250ms transitions · easing `cubic-bezier(0.25, 1, 0.5, 1)` · no spring/bounce in pro UI.

## Dark mode
Use `light-dark()`. Borders over shadows on dark; reduce chroma for status colors; invert lightness, keep hierarchy.

## Custom controls
Never use native `<select>`/date inputs for styled UI; build custom (trigger + popover). Custom select trigger: `display:inline-flex; white-space:nowrap`.

## Icons & states
Consistent library (Lucide/Phosphor); icons clarify not decorate. Every element needs hover/active/focus/disabled; data needs loading/empty/error.

---
_Skill source: [joshuadavidthomas/agent-skills](https://github.com/joshuadavidthomas/agent-skills) `frontend-design-principles` (condensed). See source for license._
