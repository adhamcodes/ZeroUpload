# Skills for ZeroUpload

These guide the AI while upgrading ZeroUpload. Kiro picks them up at the start of
a session; the agent also reads them directly. Each is a folder with a `SKILL.md`.

## Installed
- **frontend-design-principles/** — design craft (app.md for the tool UI,
  marketing.md for landing/SEO pages, references/principles.md for CSS values).
  Installed from [joshuadavidthomas/agent-skills](https://github.com/joshuadavidthomas/agent-skills) (condensed; see source for license).
- **zeroupload-brand-system/** — custom: Quiet Luxury tokens, voice, the V2
  category-hub UX, and the SACRED MOTTO (no upload/server/signup, $0).
- **client-side-conversion-playbook/** — custom: how to add in-browser engines
  (WASM <25 MiB split, ESM ffmpeg core, lazy-load, memory guards, no silent
  failures) + a feasibility matrix for new features (PDF tools ✅, image
  compress/resize ✅, OCR ✅, translation removed).

## Use
- Auto: Kiro matches your request to a skill's description.
- Manual: type `/` and pick the skill.
- To build V2: open an Autonomous session and paste `ZEROUPLOAD-V2-PROMPT.md`.

## Add more later
Drop a new folder with a `SKILL.md`, commit, start a fresh session.
