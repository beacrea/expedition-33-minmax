# Expedition 33 Build Reference

A mobile-friendly, installable PWA covering *Clair Obscur: Expedition 33* attribute
allocation, Picto/Lumina priorities, per-character build notes, and a
skill-point spend guide that tells you what to unlock next at your level.

**Live:** https://beacrea.github.io/expedition-33-minmax/

## Usage

Open the live link, or open `index.html` directly from disk — the app is
dependency-free and deliberately avoids ES modules and `fetch()` so that
`file://` keeps working.

On iOS: open the hosted link in Safari, tap Share, then **Add to Home Screen**.
On Android/desktop Chrome: use the install prompt in the address bar.

Once loaded over HTTPS the service worker caches the app shell, so it works
fully offline afterwards.

## Project structure

```
index.html      Shell markup only
css/styles.css  All styling
js/data.js      ← edit this: tiers, characters, skill builds, pictos, checklist
js/app.js       Rendering + storage logic
sw.js           Cache-first service worker
manifest.json   PWA manifest
icons/          Generated icon set
tools/          Icon generator
```

## How the skill guide works

Skills in this game are **not gated by character level**. Every level-up banks
1 skill point and 3 attribute points, and a skill unlocks when you can pay its
SP cost *and* already own its prerequisite node. So "what unlocks at level 30"
is really "I have ~29 SP banked — what is the best order to spend it in".

`skillBuilds` in `js/data.js` answers that with a recommended spend order per
character. The app derives the budget as `level - 1`, walks the running SP
total, and labels each step:

| State | Meaning |
| --- | --- |
| ✓ in budget | Affordable with the points you have at this level |
| next up | The next purchase, and how many more SP it needs |
| ≈ level N | Roughly the level where the running total becomes affordable |

Status is applied by swapping classes, not re-rendering, so dragging the level
slider stays cheap and does not rebuild the character sections.

Two honesty caveats are baked into the UI:

- **Costs are disputed.** Wikis disagree on many SP costs (patch drift), so
  entries carry an optional `spHi`. Where present the UI shows a range, running
  totals use the *lowest* figure and are labelled a floor, and the footer states
  the full-path spread. Verso's path is 72–102 SP depending on the source.
- **Gradient skills are separate.** They cost no SP and unlock via story
  progress and Relationship Level, so they are listed apart from the SP path.

Monoco is a special case (`mode: 'feet'`): his skills come from defeating enemy
types while he is in the active party, so his entry is a hunting list keyed to
the source enemy rather than an SP order.

The spend orders are validated at generation time — every entry's prerequisite
is either a starting skill or appears earlier in the list.

## Editing content

Almost every update is a change to **`js/data.js`** — the tier bands, character
builds, universal Pictos, attribute cheat sheet, and progress checklist all live
there. Nothing in `app.js` needs to change to add a character or a checklist row.

Two rules:

1. **Bump `CACHE_VERSION` in `sw.js`** after any content change. Otherwise
   returning visitors keep the previously cached copy.
2. **Never rename or reuse a `checklistItems[].id`.** Those strings are the
   localStorage keys for saved progress. Appending and reordering are safe;
   renaming silently moves someone's ticks to the wrong row.

The worker precaches with `cache: 'reload'`, which is load-bearing. GitHub
Pages serves everything with `max-age=600`, and `cache.addAll()` reads through
the HTTP cache — so a visitor returning within ten minutes of a deploy would
have the *old* files copied into the *new* cache and pinned there by
cache-first serving. That was reproduced before the fix: bumping the version
alone did not deliver the update. Precaching is also all-or-nothing, so a
failed file leaves the previous version in charge rather than activating a
mixed-version shell.

### How updates reach a returning visitor

iOS home-screen installs (Add to Home Screen) don't reliably re-check `sw.js`
on their own — there's no reload button, no pull-to-refresh, and "closing"
the app via the app switcher doesn't guarantee a real navigation event the
way a browser tab reload does. Waiting for the browser's own update check was
reproduced as insufficient: a visitor closed and reopened the installed app
several times and stayed on an old version well after a new one had shipped.

To fix that, `app.js` now drives the check itself instead of waiting on it:

- It calls `registration.update()` right after registering, and again every
  time the page regains visibility (covers the home-screen-PWA "reopen"
  case, which resumes an already-loaded page rather than re-running scripts
  from scratch).
- `sw.js` no longer calls `self.skipWaiting()` unconditionally on install.
  When an existing worker is already controlling the page, a newly installed
  worker now parks in the `waiting` state instead of taking over and
  reloading silently.
- When a worker is waiting, the page shows an "Update now" banner
  (`#updateBanner` in `index.html`). Tapping it posts a message the worker
  listens for, which is what actually calls `skipWaiting()` — the update only
  lands when the user asks for it, so it can never interrupt an in-progress
  read or an open Export/Restore action.
- A first-ever install (no previous worker holding the page) still activates
  on its own, since there's nothing to protect the user from in that case.

One caveat: this logic only takes effect once a device is already running a
version that includes it. A device stuck on a version from *before* this
fix still has the old always-`skipWaiting()` worker in charge, so its first
update after this ships will still auto-reload silently, same as before.
Every update after that one will show the banner as designed.

## Mobile / touch notes

The UI is built touch-first. If you change the header or checklist, keep these:

- Every interactive element is at least 44&times;44px (`--tap`), and checklist
  rows sit flush with no vertical gap so adjacent targets cannot overlap.
- `touch-action: manipulation` on controls removes the 300ms double-tap delay.
- `-webkit-tap-highlight-color` is off; `:active` states provide the feedback.
- Hover styles are inside `@media (hover:hover)` so they do not stick after a tap.
- The &minus;/+ steppers exist because the slider resolves to ~3px per level on a
  phone. They step on `pointerdown` and repeat on hold.
- Switching tabs resets scroll to the top and scrolls the active chip into view.

## Storage

Progress is kept in `localStorage` under `e33_checklist` and `e33_level` — two
small values, read once on boot. All access is wrapped, so a corrupt value or
Safari private mode degrades to defaults instead of a blank page.

Note that `localStorage` is not readable from the service worker. If the worker
ever needs to see progress, move the four storage helpers at the top of
`app.js` to IndexedDB; nothing else would need to change.

## Regenerating icons

```bash
pip install pillow
python3 tools/make_icons.py
```
