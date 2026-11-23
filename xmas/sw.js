/* Christmas at Bateau Bay — offline shell.
   Bump CACHE when you change a page and want everyone to pick it up. */

const CACHE = "xmas-x67";

const SHELL = [
  "./", "./index.html", "./home.html", "./fun.html", "./crew.html", "./planner.html", "./places.html", "./food.html", "./shopping.html",
  "./chat.html", "./santa.html", "./awards.html", "./outfits.html", "./stars.html", "./games.html", "./fishing.html", "./signup.html",
  "./photos.html", "./casino.html", "./help.html", "./kristy.html", "./trauma.html", "./babies.html", "./trivia.html", "./where.html", "./music.html", "./traffic.html", "./app.js", "./app.css", "./people.js", "./places.js", "./itinerary.js", "./manifest.json", "./sally.jpg", "./spotify.png",
  "./icon-192.png", "./icon-512.png", "./logo-clear.webp",
  "./sounds/chime.mp3", "./sounds/sparkle.mp3", "./sounds/levelup.mp3", "./sounds/sleigh.mp3", "./sounds/bell.mp3", "./sounds/coin1.mp3",
  "./sounds/coin2.mp3", "./sounds/pop.mp3", "./sounds/baby.mp3", "./sounds/kaching.mp3", "./sounds/megafanfare.mp3", "./sounds/fw1.mp3"
];

// live data must never be served from cache
const LIVE = ["firestore.googleapis.com", "firebaseinstallations.googleapis.com", "identitytoolkit.googleapis.com",
              "securetoken.googleapis.com", "firebase", "country.is", "ipapi.co"];

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


// tap a "✉️ Sam" message notification: open that chat (in the app if it's already open)
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "chat.html", self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const w = wins.find(c => c.url.startsWith(self.registration.scope));
    if (w) { try { await w.navigate(url); } catch (err) {} return w.focus(); }
    return self.clients.openWindow(url);
  })());
});
