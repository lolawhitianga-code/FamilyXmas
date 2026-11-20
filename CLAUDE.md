# Working in this repo

- Family Xmas web app. Plain HTML, CSS and JavaScript - no build step. Everything is in `xmas/`.
- Live copy is at https://mybaliholiday.kiwi/xmas/ - the `xmas/` folder here is what gets uploaded there.
- Rule from Lola (20 Nov 2026): merge everything to `main` automatically, every time. Commit on the session branch, then fast-forward `main` to it and push `main` - no pull request, no waiting for Lola.
- `sw.js` caches the site for offline use. Bump its cache version whenever a file changes, or phones keep the old copy.
- Replies to Lola: point form, plain English, NZ based, metric. What changed, that it is on `main`, steps to put it live.
