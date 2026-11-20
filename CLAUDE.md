# Working in this repo

- Family Xmas web app. Plain HTML, CSS and JavaScript - no build step. Everything is in `xmas/`.
- Live copy is at https://mybaliholiday.kiwi/xmas/ - the `xmas/` folder here is what gets uploaded there.
- Rule from Lola (20 Nov 2026): merge everything to `main` automatically, every time. Commit on the session branch, then fast-forward `main` to it and push `main` - no pull request, no waiting for Lola.
- **Merging to `main` puts it live.** `.github/workflows/deploy.yml` uploads `xmas/` to `public_html/xmas` by FTP within about a minute. Check the Actions tab goes green after each push to `main`.
- `sw.js` caches the site for offline use. Bump its cache version whenever a file changes, or phones keep the old copy.
- Replies to Lola: point form, plain English, NZ based, metric. What changed, that it is on `main`, and whether the upload went green (it is live). No upload steps - she does not upload by hand any more.
