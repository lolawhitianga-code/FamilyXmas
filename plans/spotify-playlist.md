# Plan: shared Spotify playlist ("Camp tunes")

Status: built 20 Nov 2026 (build x34). Lola: one big playlist, no clean-songs line.

## What it is

One new page, `xmas/music.html`, and a tile on the home page: **🎶 Camp tunes**.

- The family's shared Spotify playlist, playing right in the page.
- A big **Open in Spotify** button and a **Join the playlist** button so anyone can add songs from their own Spotify.
- A **Song requests** list for people without Spotify (Nana, the kids, anyone on a borrowed phone):
  type the song and artist, someone with Spotify adds it and ticks it off.

## Why not have the app add songs straight to Spotify

Spotify only lets an app change a playlist if every person logs in to Spotify through it, and the app
has to be registered with Spotify (small apps are capped to a handful of named users). Too much fuss
for a family week. So the playlist itself is a normal Spotify **collaborative playlist** that Lola makes
once, and the app links to it and collects requests.

## What Lola does once (about 2 minutes)

1. In Spotify: new playlist, call it e.g. "Bateau Bay Xmas 2026".
2. Tap the person-plus icon → **Invite collaborators** → copy link. That is the *join* link.
3. Share → **Copy link to playlist**. That is the *listen* link.
4. In the app, Camp tunes page → **Set the playlist** (organiser PIN 2512) → paste both links.

## How it will work

| Part | Detail |
| --- | --- |
| Page | `xmas/music.html`, same look as `shopping.html` (header, back to Home, build stamp) |
| Player | Spotify embed (`open.spotify.com/embed/playlist/<id>`), 352 px tall. Plays full songs if the phone is logged in to Spotify, 30-second previews if not |
| Links saved | `settings("music")` → `{ playlistUrl, joinUrl, setBy }`. Set and changed with `askPin()` |
| Requests saved | `col("songs")` → `{ title, artist, forWhat, by, added, addedBy, createdAt }` |
| Request form | Song, Artist, What's it for (dropdown: Any time, Hawaiian night 24 Dec, Christmas lunch 25 Dec, Got Talent 25 Dec, Pool / beach) |
| Request row | "Mr Brightside – The Killers · asked by Sam". Buttons: **🔎 Find it** (opens Spotify search for title + artist) and **✓ Added** (records who added it, celebrate) |
| Done requests | Fold away under "On the playlist (n)", like the trolley on the shopping page |
| No playlist set yet | Page says "No playlist yet – an organiser can set one" and requests still work |
| Offline | Requests page works from cache; the player and Spotify links need signal (say so under the player) |
| Home page | New tile after Photos: `<a href="music.html"><b>🎶</b><span>Camp tunes</span></a>` |
| "Just show me my stuff" | Shows the person's own requests not yet added. Optional, step 5 |

The app's own carol music box (bottom of `app.js`) stops while the Spotify player is on screen, so the
two do not play over each other. The mute chip on Home already covers the music box.

## Steps for the coder

1. `xmas/music.html`: page, Spotify embed from `settings("music")`, Open / Join buttons, "Set the playlist" sheet behind `askPin()`.
   Accept any `open.spotify.com/playlist/<id>` link (with or without `?si=`), build the embed URL from the id, reject anything else.
2. Song requests: add form, list, Find it, Added, delete own request (or any with PIN), the "On the playlist" fold.
3. Pause the carol music box while on `music.html`.
4. Home tile; add `./music.html` to `SHELL` in `sw.js`; bump `CACHE` and every page's build stamp to x34.
5. (Optional) Own unadded requests in "Just show me my stuff".

Done looks like: paste a real playlist link with the PIN, the player shows on two phones; a request made
on one phone shows on the other within a few seconds; ticking Added moves it into the fold for both.

## Decided by Lola

- One big playlist for the week. The "What's it for" tag on requests covers the
  Hawaiian night and Got Talent.
- No clean-songs-only line.
