# Leadership & Self-Deception — Companion Site

A static, self-contained interactive companion for readers of *Leadership and Self-Deception*. Eleven tools plus bookend, mapped to the book's three parts, designed to make the ideas concrete through honest personal reflection.

No build step. No server. No external dependencies. Drop the folder on any static host or open `index.html` directly.

---

## Quick start

```
# Static host (e.g. Netlify)
Drag the project folder onto netlify.com/drop

# Local file
Open index.html in any modern browser
```

## Project structure

```
index.html          Entry point — minimal shell, all content rendered by JS
css/
  main.css          Complete design system and all component styles
js/
  app.js            Entry module — wires router, nav, settings, all tools
  router.js         Hash-based SPA router (#/ #/part-1 etc.)
  storage.js        localStorage abstraction — single versioned key
  progress.js       Per-tool completion tracking and progress bar
  companion.js      Tells Pulse floating widget
  pages/
    home.js         Home / overview page
    part1.js        Part 1 landing (Awareness)
    part2.js        Part 2 landing (The Mechanism)
    part3.js        Part 3 landing (Getting Out)
  tools/
    sealed-letter.js    Bookend — write + unseal
    spot-the-box.js     Part 1 — scenario lens quiz
    heatmap.js          Part 1 — relationship color heatmap
    two-hearts.js       Part 1 — same behavior, two internal states
    sequence-builder.js Part 2 — four-step self-betrayal diagram
    inflation-meters.js Part 2 — SVG gauge needles, reality check
    collusion-loop.js   Part 2 — circular loop SVG animator
    need-fail.js        Part 2 — slider-driven reflection
    what-hasnt-worked.js Part 3 — drag-and-sort strategy cards
    apology-builder.js  Part 3 — live inline flag highlighting
    honor-sense.js      Part 3 — contribution calendar heatmap
    leadership-radar.js Part 3 — live SVG radar chart
```

---

## Routes

| Hash                           | Page / tool                         |
|--------------------------------|-------------------------------------|
| `#/`                           | Home                                |
| `#/part-1`                     | Part 1 landing                      |
| `#/sealed-letter`              | Sealed Letter — write mode          |
| `#/part-1/spot-the-box`        | Spot the Box                        |
| `#/part-1/heatmap`             | Relationship Heatmap                |
| `#/part-1/two-hearts`          | Same Behavior, Two Hearts           |
| `#/part-2`                     | Part 2 landing                      |
| `#/part-2/sequence-builder`    | Self-Betrayal Sequence Builder      |
| `#/part-2/inflation-meters`    | Inflation Meters                    |
| `#/part-2/collusion-loop`      | Collusion Loop Animator             |
| `#/part-2/need-fail`           | Do I Need Them to Fail?             |
| `#/part-3`                     | Part 3 landing                      |
| `#/part-3/what-hasnt-worked`   | What Hasn't Worked                  |
| `#/part-3/apology-builder`     | Clean Apology Builder               |
| `#/part-3/honor-sense`         | Honor-the-Sense Tracker             |
| `#/part-3/leadership-radar`    | Out-of-the-Box Leadership Radar     |
| `#/part-3/unseal`              | Sealed Letter — unseal + reply      |

---

## localStorage schema

All data is stored under one key: `lsd_companion_v1`.

```json
{
  "version": 1,
  "createdAt": "<ISO timestamp>",
  "updatedAt": "<ISO timestamp>",
  "progress": {
    "<toolId>": "not_started | in_progress | complete"
  },
  "sealedLetter": {
    "writtenAt": "<ISO | null>",
    "text": "",
    "unsealedAt": "<ISO | null>",
    "reply": ""
  },
  "tellsPulse": [
    { "ts": "<ISO>", "tell": "<category string>" }
  ],
  "tools": {
    "spotTheBox":       { "answers": [...] },
    "heatmap":          { "rows": [...] },
    "twoHearts":        { "viewed": [...], "notes": {} },
    "sequenceBuilder":  { "fields": {} },
    "inflationMeters":  { "relationship": "", "faults": [], "virtues": [], "realityCheckMode": false },
    "collusionLoop":    { "nodes": {}, "highlightMyNode": false },
    "needFail":         { "sliders": {}, "person": "" },
    "whatHasntWorked":  { "assignments": {}, "customCards": [] },
    "apologyBuilder":   { "draft": "", "isFinal": false, "finalizedAt": null },
    "honorSense":       { "entries": [...] },
    "leadershipRadar":  { "scores": {}, "snapshots": [], "showOverlay": false }
  }
}
```

Unknown keys are preserved on read — the schema is forward-compatible.

---

## Design decisions

**In-box / out-of-box color pair** — `#C2575A` and `#3FB6A8` are reused identically across every tool that shows the continuum (Spot the Box tally, Heatmap cells, Two Hearts state labels, Collusion Loop nodes). The reader learns the visual language once.

**Live mechanics** — Every tool's insight appears as the reader interacts, not only after a submit. Gauges move as sliders change. The radar polygon bends as each statement is rated. The apology flags appear on each keystroke. The calendar fills day by day.

**Sealed letter gating** — The unseal screen (`#/part-3/unseal`) requires that (a) a letter exists and (b) the Leadership Radar is complete. Soft gating everywhere else: the site suggests order but doesn't hard-lock.

**Privacy** — Zero external requests. No CDN fonts, no analytics, no tracking. Everything is localStorage only. The settings panel provides Export (JSON download), Import (file upload), and Reset (confirm dialog).

---

## Deployment

Any static host works. Recommended:

- **Netlify Drop**: drag the folder to `app.netlify.com/drop`
- **GitHub Pages**: push to a repo, enable Pages from `main` root
- **Local**: `open index.html` (note: ES modules need a server or browser file access for imports — use `npx serve .` or VS Code Live Server if `file://` imports fail)

---

## Notes for maintainers

- Each tool module exports a single `render(container, options?)` function. It is called by the router with the `<main>` element as `container`.
- Tools read and write their own slice of `store.getTool(id)` / `store.setTool(id, data)`.
- Progress is set by each tool via `store.setProgress(toolId, status)`.
- The `companion.js` module exports `showToast(message, type)` for use by any tool.
- All SVG charts are written inline — no chart libraries. The radar, gauges, sequence diagram, and collusion loop are all hand-coded SVG with live JS updates.
