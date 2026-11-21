/* Christmas at Bateau Bay — offline shell.
   Bump CACHE when you change a page and want everyone to pick it up. */

const CACHE = "xmas-x46";

const SHELL = [
  "./", "./index.html", "./home.html", "./fun.html", "./crew.html", "./planner.html", "./places.html", "./food.html", "./shopping.html",
  "./chat.html", "./santa.html", "./awards.html", "./stars.html", "./games.html", "./fishing.html", "./signup.html",
  "./photos.html", "./casino.html", "./help.html", "./kristy.html", "./trauma.html", "./babies.html", "./where.html", "./music.html", "./traffic.html", "./app.js", "./app.css", "./people.js", "./places.js", "./itinerary.js", "./manifest.json", "./sally.jpg", "./spotify.png",
  "./icon-192.png", "./icon-512.png", "./logo-clear.webp"
];

// live data must never be served from cache
const LIVE = ["firestore.googleapis.com", "firebaseinstallations.googleapis.com", "identitytoolkit.googleapis.com",
              "securetoken.googleapis.com", "firebase"];

self.addEventListener("install", e => {
  // one at a time, so one missing file doesn't stop the rest being cached
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // only tidy up our own old caches — the other trips share this domain
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("xmas-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (LIVE.some(h => url.hostname.includes(h))) return;

  // pages, scripts and styles: fresh when online, cached when not
  const fresh = req.mode === "navigate" || (url.origin === location.origin && /\.(html|js|css|json)$|\/$/.test(url.pathname));
  if (fresh) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch (err) {
        return (await caches.match(req)) || (req.mode === "navigate" ? caches.match("./index.html") : Response.error());
      }
    })());
    return;
  }

  // photos, fonts, icons: cached if we have it
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      const keep = url.origin === location.origin || url.hostname.endsWith("gstatic.com") || url.hostname === "fonts.googleapis.com";
      if (res.ok && keep) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch (err) { return Response.error(); }
  })());
});
