# Expedition 33 Build Reference

A mobile-friendly, installable PWA covering *Clair Obscur: Expedition 33* attribute
allocation, Picto/Lumina priorities, and per-character build notes.

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
js/data.js      ← edit this: tiers, characters, pictos, checklist
js/app.js       Rendering + storage logic
sw.js           Cache-first service worker
manifest.json   PWA manifest
icons/          Generated icon set
tools/          Icon generator
```

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
