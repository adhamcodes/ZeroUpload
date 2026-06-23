# Application Design

For tools, dashboards, and product UI (the ZeroUpload converter widget itself). Philosophy: **precision and restraint in service of function.** The design should disappear — enable the task without friction.

## Directions
Precision & Density · Warmth & Approachability · Sophistication & Trust · Boldness & Clarity · Utility & Function · Data & Analysis. Pick one (or blend two) and commit. (ZeroUpload tool = warm, calm, confidence-inspiring — the drop zone is the hero.)

## Color
One accent for interactive elements; color only when it communicates (status, action, success, error). Gray builds structure. Warm vs cool foundation is a real choice.

## Layout
Content drives layout. For a single-purpose tool, the action (drop file → pick format → download) should be unmistakable and centered. No clutter around it.

## Typography
Readability and function over expression in the tool UI. Save expressive fonts for marketing/landing.

## States (critical for a converter)
Every interactive element needs: default, hover, active, focus (visible ring), disabled. The tool needs: idle, dragging, working/progress, done, error, and an "engine loading" state for heavy WASM. Missing states feel broken.

## Animation
Restrained, functional: 150ms micro-interactions, 200–250ms transitions, smooth easing, no bounce. Animation = feedback, not decoration.

## Anti-Patterns
Decorative gradients, wasted whitespace, competing hierarchies, fancy fonts in UI, color without meaning, missing states, pure-white cards on colored backgrounds.

## The Standard
Feel like a precision instrument — every element considered, the design invisible until you notice how well it works (Linear, Stripe, Notion).
