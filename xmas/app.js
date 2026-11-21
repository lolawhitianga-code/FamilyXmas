/* ============================================================
   Christmas at Bateau Bay — shared bits for every page.

     import { boot, col, settings, celebrate, me, ... } from "./app.js";

   Data lives in the same Firebase project as the other trips,
   in its own collections (all start with "xmas_"). If Firebase
   can't be reached everything still works on this phone.
   ============================================================ */
import { HOUSEHOLDS as BASE_HH, HH_COLOURS, SURNAMES } from "./people.js";

export const BUILD = "x50";

export const FIREBASE = {
  apiKey: "AIzaSyB1NnJlvpL_dv7aPrAeFGtl5MM1oSa1YPk",
  authDomain: "mybaliholiday-5170c.firebaseapp.com",
  projectId: "mybaliholiday-5170c",
  storageBucket: "mybaliholiday-5170c.firebasestorage.app",
  messagingSenderId: "29285891302",
  appId: "1:29285891302:web:9497074c278aed8c0ccf27"
};

/* Monday 21 December to Wednesday 30 December 2026 — change in the app if it moves */
export const DEFAULT_TRIP = { start:"2026-12-21", days:10 };
export const XMAS_DAY = "2026-12-25";

export const SLOTS = [
  { key:"morning", label:"Morning",           glyph:"🌅" },
  { key:"noon",    label:"Middle of the day", glyph:"☀️" },
  { key:"evening", label:"Evening",           glyph:"🌙" }
];

/* ---------- tiny helpers ---------- */
export const $ = id => document.getElementById(id);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
export const aud = n => "$" + Number(n || 0).toLocaleString("en-AU", { minimumFractionDigits:2, maximumFractionDigits:2 });
export const withTimeout = (p, ms = 8000) => Promise.race([
  p, new Promise((_, rej) => setTimeout(() => rej(new Error("Took too long to reach the server")), ms))
]);
export const uid = () => "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* dates — trip.start is "YYYY-MM-DD", days are numbered from 1 */
export const dayDate = (trip, n) => { const d = new Date(trip.start + "T00:00:00"); d.setDate(d.getDate() + n - 1); return d; };
export const fmtDay  = d => d.toLocaleDateString("en-NZ", { weekday:"short", day:"numeric", month:"short" });
export const fmtLong = d => d.toLocaleDateString("en-NZ", { weekday:"long", day:"numeric", month:"long" });
export const isoDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const fromIso = s => new Date(s + "T00:00:00");
export const todayIso = () => isoDate(new Date());
/** Which trip day is today? <1 before we go, >days once we're home */
export function tripDayToday(trip){
  const s = new Date(trip.start + "T00:00:00"), t = new Date(); t.setHours(0,0,0,0);
  return Math.round((t - s) / 86400000) + 1;
}
/** Every date of the trip as [{n, iso, date}] */
export const tripDays = trip => Array.from({ length: trip.days }, (_, i) => { const d = dayDate(trip, i + 1); return { n:i+1, iso:isoDate(d), date:d }; });

export const mapsLink = (q, placeId) =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q) +
  (placeId ? "&query_place_id=" + encodeURIComponent(placeId) : "");
export const dirLink = (to) => "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(to);
export const auDigits = p => { let d = String(p || "").replace(/\D/g, ""); if(d.startsWith("0")) d = "61" + d.slice(1); return d; };

/* ============================================================
   THE FAMILY — 14 households, 39 people (plus anyone added)
   A person is { id, name, label, hh, colour }. label is the name
   made unique ("Jack (Trudi's)") — use it wherever names sit together.
   A household is { id, name, people:[names], members:[person], arrive, leave, stay, site, note, colour }.
   ============================================================ */
const joinNames = a => a.length < 2 ? (a[0] || "") : a.slice(0, -1).join(", ") + " & " + a[a.length - 1];
let _extras = [], _roster = {}, _households = [], _people = [];
const _peopleSubs = [];

function rebuildPeople(){
  const hhs = BASE_HH.map((h, i) => ({ ...h, site:"", ...( _roster[h.id] || {}), colour: HH_COLOURS[i % HH_COLOURS.length], people:[...h.people] }));
  // households someone has added in the app
  _extras.filter(x => x.newHousehold).forEach(x => {
    if(!hhs.some(h => h.id === x.hh))
      hhs.push({ id:x.hh, people:[], arrive:x.arrive || DEFAULT_TRIP.start, leave:x.leave || "2026-12-28", stay:x.stay || "Cabin", note:"", site:"",
                 ...(_roster[x.hh] || {}), colour: HH_COLOURS[hhs.length % HH_COLOURS.length] });
  });
  const extraByHh = {};
  _extras.forEach(x => { (extraByHh[x.hh] = extraByHh[x.hh] || []).push(x); });
  const people = [];
  hhs.forEach(h => {
    const base = h.people.map(n => ({ id: h.id + "-" + slug(n), name:n, hh:h.id, colour:h.colour }));
    const added = (extraByHh[h.id] || []).map(x => ({ id: x.pid || x.id, name:x.name, hh:h.id, colour:h.colour, added:true, rowId:x.id }));
    h.members = [...base, ...added];
    h.people = h.members.map(p => p.name);
    h.name = joinNames(h.people);
    people.push(...h.members);
  });
  // same first name twice? tag each with the first name in their household
  const count = {}; people.forEach(p => { count[p.name] = (count[p.name] || 0) + 1; });
  people.forEach(p => {
    if(count[p.name] > 1){ const first = hhs.find(h => h.id === p.hh).members[0]; p.label = first.id === p.id ? p.name : `${p.name} (${first.name}'s)`; }
    else p.label = p.name;
  });
  _households = hhs; _people = people;
  if(me){ const fresh = people.find(p => p.id === me.id); if(fresh) me = fresh; }
  _peopleSubs.forEach(cb => cb());
}

/** Everyone, right now. Grows if people are added in the app — use onPeople to hear about it. */
export const people = () => _people;
export const households = () => _households;
/** Families grouped by surname, in SURNAMES order: [{ surname, list }]. No surname → "More family", last. */
export function bySurname(hs = _households){
  const order = [...SURNAMES, ...new Set(hs.map(h => h.surname).filter(s => s && !SURNAMES.includes(s)))];
  const groups = order.map(surname => ({ surname, list: hs.filter(h => h.surname === surname) }));
  groups.push({ surname:"More family", list: hs.filter(h => !h.surname) });
  return groups.filter(g => g.list.length);
}
export const person = id => _people.find(p => p.id === id) || { id, name:"Someone", label:"Someone", hh:"", colour:"#3E5A63" };
export const household = id => _households.find(h => h.id === id) || { id, name:"A family", people:[], members:[], colour:"#3E5A63" };
export const pname = id => person(id).label;
/** Call cb() now and again whenever the family list changes (someone added, dates edited). */
export function onPeople(cb){ _peopleSubs.push(cb); cb(); }
/** Is this household at camp on this date ("YYYY-MM-DD")? Arrival day counts, leaving day counts too. */
export const hereOn = (h, iso) => h.arrive <= iso && iso <= h.leave;
/** Little round dot in the family's colour. Pass a person id or a household id. */
export const badge = id => { const c = (String(id).includes("-") ? person(id) : household(id)).colour;
  return `<span class="dot" style="background:${c}"></span>`; };

/* ============================================================
   WHO'S THIS — picked on the front page, checked on every page
   ============================================================ */
export let me = null;
rebuildPeople();
{ const saved = localStorage.getItem("xmas_me"); if(saved) me = _people.find(p => p.id === saved) || { id:saved, name:localStorage.getItem("xmas_me_name") || "You", label:localStorage.getItem("xmas_me_name") || "You", hh:localStorage.getItem("xmas_me_hh") || "", colour:"#3E5A63" }; }
export function setMe(p){ me = p; localStorage.setItem("xmas_me", p.id); localStorage.setItem("xmas_me_name", p.name); localStorage.setItem("xmas_me_hh", p.hh); }
export const myHousehold = () => household(me ? me.hh : "");

/* ============================================================
   STORAGE — Firestore (xmas_* collections) or this device
   ============================================================ */
let _cloud = null;
function cloud(){
  if(_cloud) return _cloud;
  _cloud = (async () => {
    if(!FIREBASE.projectId) return null;
    try{
      const [{ initializeApp }, fs, fa] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js")
      ]);
      const app = initializeApp(FIREBASE);
      try{ await withTimeout(fa.signInAnonymously(fa.getAuth(app)), 8000); }
      catch(e){ /* rules may still let us in */ }
      let db;
      try{
        db = fs.initializeFirestore(app, {
          localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
        });
      }catch(e){ db = fs.getFirestore(app); }
      return { fs, db };
    }catch(e){
      banner("Couldn't reach the shared Christmas site, so this is saving on your phone only. (" + e.message + ")");
      return null;
    }
  })();
  return _cloud;
}

const LKEY = name => "xmas_local_" + name;
const lread = name => { try{ return JSON.parse(localStorage.getItem(LKEY(name)) || "[]"); }catch(e){ return []; } };
const lwrite = (name, rows) => localStorage.setItem(LKEY(name), JSON.stringify(rows));
const localSubs = {};
const lpush = name => (localSubs[name] || []).forEach(cb => cb(lread(name)));

/** A collection. name is without the prefix: col("planner") → "xmas_planner".
 *  subscribe(cb) calls cb(rows) every time anything changes, rows = [{id, ...data}] */
export function col(name){
  const full = "xmas_" + name;
  return {
    subscribe(cb, onErr){
      cloud().then(c => {
        if(!c){ (localSubs[name] = localSubs[name] || []).push(cb); cb(lread(name)); return; }
        c.fs.onSnapshot(c.fs.collection(c.db, full),
          snap => cb(snap.docs.map(d => ({ id:d.id, ...d.data() }))),
          err => { banner("Can't reach the shared Christmas site right now — " + (err.code || err.message)); onErr && onErr(err); });
      });
    },
    async add(v){
      const row = { ...v, createdAt: Date.now(), by: me ? me.id : null };
      const c = await cloud();
      if(!c){ const r = lread(name); r.push({ ...row, id: uid() }); lwrite(name, r); lpush(name); return; }
      return withTimeout(c.fs.addDoc(c.fs.collection(c.db, full), row));
    },
    async update(id, v){
      const c = await cloud();
      if(!c){ const r = lread(name); const x = r.find(i => i.id === id); if(x) Object.assign(x, v); lwrite(name, r); lpush(name); return; }
      return withTimeout(c.fs.updateDoc(c.fs.doc(c.db, full, id), v));
    },
    async set(id, v){   // create-or-merge with a known id
      const c = await cloud();
      if(!c){ const r = lread(name); const x = r.find(i => i.id === id); if(x) Object.assign(x, v); else r.push({ id, ...v }); lwrite(name, r); lpush(name); return; }
      return withTimeout(c.fs.setDoc(c.fs.doc(c.db, full, id), v, { merge:true }));
    },
    async remove(id){
      const c = await cloud();
      if(!c){ lwrite(name, lread(name).filter(i => i.id !== id)); lpush(name); return; }
      return withTimeout(c.fs.deleteDoc(c.fs.doc(c.db, full, id)));
    },
    async get(id){      // one document, or null
      const c = await cloud();
      if(!c) return lread(name).find(i => i.id === id) || null;
      const d = await withTimeout(c.fs.getDoc(c.fs.doc(c.db, full, id)));
      return d.exists() ? { id:d.id, ...d.data() } : null;
    }
  };
}

/** A single shared settings document: settings("trip"), settings("route") … */
export function settings(key){
  const s = col("settings");
  return {
    subscribe(cb){ s.subscribe(rows => { const r = rows.find(x => x.id === key); cb(r || null); }); },
    save(v){ return s.set(key, v); }
  };
}


/** Trip dates with the default filled in. cb({start, days}) */
export function watchTrip(cb){
  settings("trip").subscribe(t => cb({ ...DEFAULT_TRIP, ...(t || {}) }));
}

/* keep the family list live: extra people, and edits to dates / cabins / notes */
col("people").subscribe(rows => { _extras = rows; rebuildPeople(); });
settings("roster").subscribe(r => { _roster = r || {}; rebuildPeople(); });
/** Add someone. hhId of an existing family, or null with a new family made for them. */
export async function addPerson(name, hhId){
  const pid = "p-" + uid();
  if(hhId) await col("people").add({ name, hh:hhId, pid });
  else { hhId = "hx" + uid(); await col("people").add({ name, hh:hhId, pid, newHousehold:true }); }
  return { id:pid, name, label:name, hh:hhId, colour: household(hhId).colour };
}
/** Change a family's dates, cabin/caravan, site number or note. */
export const saveHousehold = (hhId, v) => settings("roster").save({ [hhId]: { ...(_roster[hhId] || {}), ...v } });

/* ============================================================
   ORGANISER PIN — for the few things only an organiser should do
   (starting the Secret Santa, clearing a comp). Default 2512.
   ============================================================ */
let _pin = "2512";
settings("admin").subscribe(a => { if(a && a.pin) _pin = String(a.pin); });
/** Ask for the organiser PIN in a sheet. Resolves true if it's right. */
export function askPin(why = "This bit is for the organisers."){
  if(sessionStorage.getItem("xmas_pin_ok") === "1") return Promise.resolve(true);
  return new Promise(res => {
    let done = false;
    const sh = openSheet(`<h3>Organiser PIN</h3><p class="muted small">${esc(why)}</p>
      <label class="f" for="pinIn">PIN</label><input class="in" id="pinIn" inputmode="numeric" autocomplete="off" maxlength="8">
      <div class="acts"><button class="btn ghost" id="pinNo">Cancel</button><button class="btn red" id="pinGo">OK</button></div>`,
      () => { if(!done) res(false); });
    const go = () => {
      if(sh.el.querySelector("#pinIn").value.trim() === _pin){ done = true; sessionStorage.setItem("xmas_pin_ok", "1"); closeSheet(); res(true); }
      else toast("That's not it");
    };
    sh.el.querySelector("#pinGo").onclick = go;
    sh.el.querySelector("#pinIn").addEventListener("keydown", e => { if(e.key === "Enter") go(); });
    sh.el.querySelector("#pinNo").onclick = () => closeSheet();
  });
}
export const setPin = pin => settings("admin").save({ pin:String(pin) });

/* ============================================================
   GOLD STARS — the show happens first, the score is written after
   ============================================================ */
export const STAR = {
  alldone:  [50, "That's the lot",       "nothing left on the list"],
  champion: [30, "Tournament winner",    "bragging rights secured"],
  santa:    [20, "In the Secret Santa",  "wrap it well"],
  cook:     [20, "On the roster",        "the family thanks you"],
  catch:    [20, "Fish on the board",    "that's a keeper"],
  host:     [15, "Happy hour hosted",    "cheers"],
  result:   [15, "Result logged",        "the ladder moves"],
  activity: [15, "Activity on",          "who's in?"],
  dish:     [10, "Dish claimed",         "Christmas lunch grows"],
  planner:  [10, "On the plan",          ""],
  expense:  [10, "Expense in",           "square by New Year"],
  photo:    [10, "Photo up",             "on the wall"],
  outfit:   [10, "Outfit entered",       "strike a pose"],
  signup:   [5,  "You're in",            ""],
  vote:     [5,  "Vote counted",         ""],
  shopping: [5,  "On the list",          ""],
  bought:   [5,  "In the trolley",       ""],
  keen:     [3,  "Keen",                 ""],
  wish:     [5,  "Wish list updated",    "Santa's taking notes"],
  guess:    [5,  "Guess in",             "Kay's keeping score"],
  checkin:  [5,  "Checked in",           "the family knows where you are"],
  song:     [3,  "Song asked for",       "turn it up"],
  tune:     [5,  "On the playlist",      "camp tunes"]
};

let _ac = null;
function _actx(){
  if(localStorage.getItem("xmas_muted") === "1") return null;
  try{
    if(!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
    if(_ac.state === "suspended") _ac.resume();
    return _ac;
  }catch(e){ return null; }
}
addEventListener("pointerdown", function u(){
  const c = _actx(); if(c && c.state === "running") removeEventListener("pointerdown", u, true);
}, true);
export const isMuted = () => localStorage.getItem("xmas_muted") === "1";
export const setMuted = v => { localStorage.setItem("xmas_muted", v ? "1" : "0"); dispatchEvent(new Event("xmas-mute")); };

function _note(c, f, at, dur, vol, type){
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || "triangle"; o.frequency.setValueAtTime(f, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + dur + 0.05);
}
function _sound(pts){
  const c = _actx(); if(!c) return;
  const t = c.currentTime + 0.02, big = pts >= 15;
  const ns = big ? [523.25,659.25,783.99,1046.5,1318.51] : [523.25,659.25,783.99,1046.5];
  ns.forEach((f,i) => { _note(c,f,t+i*0.075,0.42,0.16,"triangle"); _note(c,f*2,t+i*0.075,0.2,0.05,"sine"); });
  const tail = t + ns.length*0.075;
  for(let i=0;i<(big?7:4);i++) _note(c,1600+Math.random()*1600,tail+i*0.045,0.16,0.035,"sine");
  if(big) _note(c,130.81,t,0.9,0.1,"sine");
}
/* a little car horn — for the driving log */
/* sleigh bells — a little jingle for festive moments */
export function jingle(){
  const c = _actx(); if(!c) return;
  const t = c.currentTime + 0.02;
  for(let i = 0; i < 6; i++){ _note(c, 2400 + (i % 2) * 380, t + i * 0.11, 0.09, 0.05, "square"); _note(c, 3300 + (i % 3) * 210, t + i * 0.11, 0.07, 0.03, "sine"); }
}

function _css(){
  if(document.getElementById("xmas-star-css")) return;
  const s = document.createElement("style"); s.id = "xmas-star-css";
  s.textContent = `#xmas-stars{position:fixed;inset:0;z-index:99998;pointer-events:none;overflow:hidden}
#xmas-stars b{position:absolute;top:-8vh;display:block;line-height:1;color:#FFD166;
 text-shadow:0 0 14px rgba(255,193,71,.9),0 2px 5px rgba(120,70,0,.45);will-change:transform,opacity;
 animation:xmas-fall var(--dur) cubic-bezier(.35,.1,.6,1) var(--delay) both}
@keyframes xmas-fall{0%{transform:translate3d(0,0,0) rotate(0) scale(.7);opacity:0}
 10%{opacity:1;transform:translate3d(0,10vh,0) rotate(60deg) scale(1)}
 100%{transform:translate3d(var(--dx),112vh,0) rotate(var(--rot)) scale(1);opacity:0}}
#xmas-pop{position:fixed;left:50%;top:34%;transform:translate(-50%,-50%);z-index:99999;
 pointer-events:none;text-align:center;animation:xmas-pop 2.1s cubic-bezier(.2,1.3,.4,1) both}
#xmas-pop .n{font-family:'Fraunces',Georgia,serif;font-weight:900;font-size:clamp(54px,17vw,92px);
 line-height:.9;color:#FFD166;text-shadow:0 0 34px rgba(255,193,71,.75),0 4px 14px rgba(60,32,0,.5);display:block}
#xmas-pop .l{font-family:'Outfit',system-ui,sans-serif;font-weight:600;font-size:19px;color:#fff;
 text-shadow:0 2px 12px rgba(43,27,20,.85);margin-top:4px;display:block}
#xmas-pop .s{font-family:'DM Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.16em;
 text-transform:uppercase;color:rgba(255,255,255,.85);text-shadow:0 2px 10px rgba(43,27,20,.85);margin-top:6px;display:block}
@keyframes xmas-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}
 14%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}24%{transform:translate(-50%,-50%) scale(1)}
 74%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-58%) scale(.96)}}`;
  document.head.appendChild(s);
}

/** Call BEFORE awaiting any save, so the stars show even on a slow connection. */
export function celebrate(kind, opts){
  const a = STAR[kind]; if(!a) return;
  const [pts, label, note] = a;
  _css();
  const old = document.getElementById("xmas-pop"); if(old) old.remove();
  const p = document.createElement("div"); p.id = "xmas-pop";
  p.innerHTML = `<span class="n">+${pts}</span><span class="l">${label}</span>` + (note ? `<span class="s">${note}</span>` : "");
  document.body.appendChild(p); setTimeout(() => p.remove(), 2200);
  const wrap = document.createElement("div"); wrap.id = "xmas-stars";
  const n = Math.min(64, 16 + pts * 1.6), gl = ["★","★","★","✦","⭐"];
  let h = "";
  for(let i = 0; i < n; i++){
    h += `<b style="left:${Math.random()*100}%;font-size:${13+Math.random()*26}px;--dur:${1.5+Math.random()*1.6}s;--delay:${Math.random()*0.7}s;--dx:${(Math.random()*2-1)*22}vw;--rot:${(Math.random()*2-1)*720}deg;opacity:${0.65+Math.random()*0.35}">${gl[i%gl.length]}</b>`;
  }
  wrap.innerHTML = h; document.body.appendChild(wrap); setTimeout(() => wrap.remove(), 4200);
  _sound(pts);
  const who = (opts && opts.who) || (me && me.id);
  if(who) score(who, kind, pts).catch(() => {});
}

async function score(who, kind, pts){
  const c = await cloud();
  if(!c){
    const r = lread("scores"); let x = r.find(i => i.id === who);
    if(!x){ x = { id:who, total:0, counts:{} }; r.push(x); }
    x.total += pts; x.counts[kind] = (x.counts[kind] || 0) + 1; lwrite("scores", r); lpush("scores");
    const l = lread("starlog"); l.push({ id:uid(), who, kind, pts, at:Date.now() }); lwrite("starlog", l); lpush("starlog");
    return;
  }
  const { fs, db } = c;
  await fs.setDoc(fs.doc(db, "xmas_scores", who),
    { total: fs.increment(pts), counts: { [kind]: fs.increment(1) }, updated: Date.now() }, { merge:true });
  await fs.addDoc(fs.collection(db, "xmas_starlog"), { who, kind, pts, at: Date.now() });
}

/* ============================================================
   THE CASINO — Lucky Lola's lives on the same website. Lucky
   Lauren is the family's own machine, so it gets top billing.
   ============================================================ */
export const GAMES = [
  { name:"Lucky Lauren",             file:"lucky_lauren.html",            kind:"pokies", tag:"Everyone's on the reels — wilds, free spins and a jackpot chase.", star:true },
  { name:"Poppy Roy's Fishing Trip", file:"poppy_roys_fishing_trip.html", kind:"pokies", tag:"Cast a line for carp, cod and the odd snag." },
  { name:"The Gilded",               file:"gilded_slots.html",            kind:"pokies", tag:"A Deco fortune machine dripping in gold and jackpots." },
  { name:"Daisy's Beach Slots",      file:"daisy_slots.html",             kind:"pokies", tag:"Land 5 Daisys on a line for the jackpot." },
  { name:"Slovak Slots",             file:"slovak_slots.html",            kind:"pokies", tag:"Beer, Tatras, and a feast fit for a jackpot." },
  { name:"Whisker Wild",             file:"whisker_wild.html",            kind:"pokies", tag:"Chasing birds and dodging fish tanks." },
  { name:"Outback Dash",             file:"outback_dash.html",            kind:"pokies", tag:"Kangaroos, rocks and rivals roll down every reel." },
  { name:"Planet's Pleasures",       file:"planets_pleasures.html",       kind:"pokies", tag:"Op shopping on nothing but petrol money." },
  { name:"Blackjack",                file:"blackjack.html",               kind:"cards",  tag:"Beat the dealer to 21." },
  { name:"Texas Hold'em",            file:"texas_holdem.html",            kind:"cards",  tag:"Poker night, any time of day." },
  { name:"Baccarat",                 file:"baccarat.html",                kind:"cards",  tag:"Player or banker?" },
  { name:"Chocolate Wheel",          file:"chocolate_wheel.html",         kind:"fun",    tag:"Spin the wheel, win the meat tray." },
  { name:"Craps",                    file:"craps.html",                   kind:"fun",    tag:"Roll the bones." },
  { name:"Rock Paper Scissors",      file:"rock_paper_scissors.html",     kind:"fun",    tag:"Settle it properly." },
  { name:"Frenchie Bubble Pop",      file:"frenchie_bubble_pop.html",     kind:"fun",    tag:"Pop the safe bubbles, dodge the Ruff ones." },
  { name:"The Lost Spring",          file:"lost_spring.html",             kind:"fun",    tag:"Five hidden pools, only some hot enough to soak in." },
  { name:"Exterminator!!!",          file:"exterminator.html",            kind:"fun",    tag:"Bank anytime, but watch out for the Benda." },
  { name:"Sally & Steve's Aussie Adventure", file:"sally_steves_aussie_adventure.html", kind:"fun", tag:"Cash out before Steve's had enough." },
  { name:"Lochie, Cooper & Josh's Olympics", file:"lochie_josh_olympics.html", kind:"fun", tag:"Back Lochie, Cooper or Josh, then sprint, hurdle, long jump or throw the discus." }
];
/* The games sit either in /Casino/ or beside the Bali pages — we check once which, and remember. */
let _casino = sessionStorage.getItem("xmas_casino") || "../Casino/";
(async () => {
  if(sessionStorage.getItem("xmas_casino")) return;
  for(const base of ["../Casino/", "../"]){
    try{ const r = await fetch(base + "lucky_lauren.html", { method:"HEAD" }); if(r.ok){ _casino = base; sessionStorage.setItem("xmas_casino", base); return; } }catch(e){}
  }
})();
export const gameUrl = g => _casino + g.file;
export const casinoLobby = () => "../Casino/";
export const LUCKY_LAUREN = GAMES[0];
let _lastGame = null;
/** A random game — Lucky Lauren about half the time, never the same pick twice running.
 *  Returns {name, tag, kind, url}. */
export function randomGame(pokiesOnly = false){
  let g;
  if(_lastGame !== LUCKY_LAUREN.file && Math.random() < 0.5) g = LUCKY_LAUREN;
  else { const pool = GAMES.filter(x => x.file !== _lastGame && !x.star && (!pokiesOnly || x.kind === "pokies")); g = pool[Math.floor(Math.random() * pool.length)]; }
  _lastGame = g.file;
  return { ...g, url: gameUrl(g) };
}

/* ============================================================
   ONE LOGIN — whoever you are here, you are in the casino too.
   The casino keeps its own accounts (in its own Firebase), and
   remembers who's playing on this phone in "cc_session". So the
   first time someone from this trip heads for a game we make
   them a casino account and sign this phone into it — no second
   login. Rules:
   - a phone already signed in to its OWN casino account (one made
     at the casino, with a password) is left exactly as it is;
   - trip-made accounts are named "x-<who>", so they can never
     land on, or take over, an account someone made themselves;
   - the same person on another phone gets the same account, so
     their balance follows them.
   ============================================================ */
const CASINO_FB = {
  apiKey: "AIzaSyAtJlkaaHeFCTcFyBXTP1u6_I0yIiy7ibc",
  authDomain: "suncitycasino-c77dd.firebaseapp.com",
  projectId: "suncitycasino-c77dd",
  storageBucket: "suncitycasino-c77dd.firebasestorage.app",
  messagingSenderId: "368932704623",
  appId: "1:368932704623:web:7332b0c8163f18026d589a"
};
const TRIP_ACCOUNT = /^(x|r)-/;                 // casino usernames made by a trip site
let _casinoLink = null, _casinoReady = false, _casinoDb = null;
/** The casino's own Firestore (loaded once). */
function casinoDb(){
  if(!_casinoDb) _casinoDb = Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
  ]).then(([{ initializeApp }, fs]) => ({ fs, db: fs.getFirestore(initializeApp(CASINO_FB, "casino")) }))
    .catch(e => { _casinoDb = null; throw e; });
  return _casinoDb;
}
/** Make sure this phone is signed in to the casino as the person signed in here. Safe to call often. */
export function linkCasino(){
  if(_casinoLink) return _casinoLink;
  _casinoLink = (async () => {
    const who = me && !noPokies() ? { id: me.id, name: me.name } : null;
    if(!who) return;
    const want = "x-" + who.id, flag = "xmas_casino_ok";
    let cur = null; try{ cur = JSON.parse(localStorage.getItem("cc_session") || "null"); }catch(e){}
    if(cur && cur.username && !TRIP_ACCOUNT.test(cur.username)) return;          // their own casino account — hands off
    if(cur && cur.username === want && localStorage.getItem(flag) === want) return;   // already done on this phone
    const { db, fs } = await casinoDb();
    const ref = fs.doc(db, "accounts", want);
    const snap = await withTimeout(fs.getDoc(ref), 6000);
    if(!snap.exists()){
      // the same shape the casino itself makes for a new free-play account
      await withTimeout(fs.setDoc(ref, {
        username: want, displayName: who.name, password: "trip-" + Math.random().toString(36).slice(2, 12),
        createdAt: Date.now(), accountType: "free", tokenType: "points", balanceFree: 500, balancePaid: 0,
        bankrupt: false, transactions: [], isAdmin: false,
        depositLimits: { period:"daily", amount:null, periodStart: Date.now(), depositedInPeriod:0, pendingIncrease:null },
        tripLinked: true, tripSite: "xmas"
      }), 6000);
    }
    localStorage.setItem("cc_session", JSON.stringify({ username: want }));
    localStorage.setItem(flag, want);
  })().catch(e => { console.warn("casino sign-in didn't go through:", e && e.message); _casinoLink = null; })
      .finally(() => { _casinoReady = true; });
  return _casinoLink;
}

/* ============================================================
   🏆 WINDFALLS — everyone "wins" something silly: $2,000 added to
   their casino balance, once each, the next time they open the
   app. The reason is picked at random (beauty contest, the dog's
   outfit, the surf comp…). The payout is marked on the casino
   account itself ("raffle2026" — the first version called it the
   raffle), inside a transaction, so two phones can never pay the
   same person twice. It goes to whichever casino account this
   phone plays on. People who've switched the pokies off are left
   out. If the casino can't be reached it tries again next page.

   ⭐ STAR SWAP — anyone with 50+ gold stars is asked, at most once
   a day, if they'd like to swap some for casino money at a very
   kind rate (1 star = $100). Stars come off their total first;
   if the casino can't be reached they go straight back.
   ============================================================ */
const RAFFLE = { key: "raffle2026", amount: 2000 };
const WINS = [
  ["💄", "won second prize in a beauty contest"],
  ["🐶", "your dog won Best Dressed at the dog show"],
  ["🏄", "won the surfing comp at Bateau Bay"],
  ["🎟️", "won the raffle"],
  ["🏰", "won the sandcastle competition"],
  ["🥧", "won the pie-eating contest"],
  ["🐱", "your cat won Best in Show"],
  ["🎄", "won Best Christmas Lights on the street"],
  ["🦷", "the tooth fairy paid you years of back pay"],
  ["🍰", "your pavlova won first prize at the show"],
  ["🐔", "your chook won the chook race"],
  ["🕺", "won the dance-off at the RSL"]
];
const SWAP = { min: 50, rate: 100, every: 20 * 3600 * 1000 };
const money = n => "$" + Math.round(Number(n) || 0).toLocaleString("en-NZ");
let _raffleBusy = false;

/** The casino account this phone plays on, if it's really this person's. */
function casinoUser(){
  let cur = null; try{ cur = JSON.parse(localStorage.getItem("cc_session") || "null"); }catch(e){}
  const user = cur && cur.username;
  return !user || (TRIP_ACCOUNT.test(user) && user !== "x-" + me.id) ? null : user;
}
/** Add (or take) casino money. Returns the new balance, or null if there's no such account. */
async function casinoAdd(user, amount, mark){
  const { db, fs } = await casinoDb();
  const ref = fs.doc(db, "accounts", user);
  return withTimeout(fs.runTransaction(db, async t => {
    const snap = await t.get(ref);
    if(!snap.exists()) return null;
    const d = snap.data();
    if(mark && d[mark]) return false;
    const balance = (Number(d.balanceFree) || 0) + amount;
    t.update(ref, mark ? { balanceFree: balance, [mark]: Date.now() } : { balanceFree: balance });
    return balance;
  }), 10000);
}

async function raffleWin(page){
  if(!me || noPokies() || _raffleBusy) return;
  _raffleBusy = true;
  try{
    const seen = "xmas_raffle_" + me.id;
    if(!localStorage.getItem(seen)){
      await linkCasino();
      const user = casinoUser(); if(!user) return;   // not signed in as them yet — next time
      const res = await casinoAdd(user, RAFFLE.amount, RAFFLE.key);
      if(res === null) return;
      localStorage.setItem(seen, user);
      if(res !== false){ winPopup(res, page); return; }
    }
    await starOffer(page);
  }catch(e){ console.warn("windfall didn't go through:", e && e.message); }
  finally{ _raffleBusy = false; }
}

function winCSS(){
  if(document.getElementById("raffle-css")) return;
  const st = document.createElement("style"); st.id = "raffle-css";
  st.textContent = `.winpop{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:16px;overflow:hidden;background:rgba(10,43,31,.72);animation:rf-in .25s ease}
@keyframes rf-in{from{opacity:0}}
.winpop .box{position:relative;z-index:1;width:100%;max-width:400px;max-height:92vh;overflow:auto;text-align:center;color:#fff;border-radius:20px;padding:0 18px 18px;
 background:linear-gradient(160deg,#7A1E1A,#4B0F2E 55%,#2A0A3A);box-shadow:0 0 0 3px #FFD166,0 0 0 5px #9C6C14,0 0 40px rgba(255,209,102,.5);animation:rf-pop .5s cubic-bezier(.2,1.5,.4,1)}
@keyframes rf-pop{from{transform:scale(.6) rotate(-4deg);opacity:0}}
.winpop .tape{margin:0 -18px 14px;padding:8px 10px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.2em;font-weight:500;color:#2A0A0A;
 background:repeating-linear-gradient(-45deg,#FFD166 0 14px,#E2A93B 14px 28px)}
.winpop .big{font-size:50px;line-height:1;margin:4px 0}
.winpop h3{font-family:'Fraunces',serif;font-weight:900;font-size:24px;line-height:1.15;margin:4px 0 2px;color:#FFD166}
.winpop .amt{font-family:'Fraunces',serif;font-weight:900;font-size:clamp(54px,18vw,72px);line-height:1;margin:6px 0 8px;color:#FFD166;
 text-shadow:0 3px 0 #9C6C14,0 0 26px rgba(255,209,102,.6);animation:rf-glow 1.2s ease-in-out infinite alternate}
@keyframes rf-glow{to{text-shadow:0 3px 0 #9C6C14,0 0 40px rgba(255,209,102,.95)}}
.winpop p{margin:0 auto 8px;max-width:30ch;font-size:15px;opacity:.95}
.winpop .bal{display:inline-block;font-family:'DM Mono',monospace;font-size:13px;background:rgba(0,0,0,.28);border:1px solid rgba(255,209,102,.5);border-radius:999px;padding:6px 12px;margin:2px 0 14px;color:#FFE9B0}
.winpop .go{display:block;width:100%;border:0;background:linear-gradient(180deg,#FFD166,#E2A93B);color:#2A0A0A;font-family:inherit;font-weight:700;font-size:22px;line-height:1.2;padding:18px 20px;border-radius:999px;text-decoration:none;
 box-shadow:0 5px 0 #9C6C14,0 12px 22px -6px rgba(0,0,0,.6)}
.winpop .go:active{transform:translateY(3px);box-shadow:0 2px 0 #9C6C14}
.winpop .go.sm{font-size:16.5px;padding:13px 14px;margin-top:10px}
.winpop .go small{display:block;font-size:12.5px;font-weight:600;opacity:.75}
.winpop .later{display:block;margin:14px auto 0;background:none;border:0;color:#FFE9B0;font-size:13.5px;text-decoration:underline;text-underline-offset:3px}
.winpop .deal{max-width:none;font-family:'DM Mono',monospace;font-size:12px;color:#FFE9B0;margin:0 0 6px}
.winpop .deal s{opacity:.6}
.winpop .conf{position:absolute;z-index:2;top:-20px;width:8px;height:14px;border-radius:2px;pointer-events:none;animation:rf-fall linear forwards}
@keyframes rf-fall{to{transform:translateY(110vh) rotate(720deg)}}`;
  document.head.appendChild(st);
}
function confetti(el){
  const colours = ["#FFD166", "#D8352A", "#1F8A5B", "#fff", "#E2A93B"];
  for(let i = 0; i < 40; i++){
    const c = document.createElement("i"); c.className = "conf";
    c.style.cssText = `left:${Math.random() * 100}%;background:${colours[i % colours.length]};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * 1.2}s`;
    el.appendChild(c);
  }
  try{ jingle(); }catch(e){}
}
/** The big "you won" pop-up. goPage: where the gold button goes (on the casino page it just closes). */
function bigWin(page, { tape, icon, head, amount, text, balance }){
  winCSS();
  const el = document.createElement("div"); el.id = "raffle"; el.className = "winpop"; el.setAttribute("role", "dialog");
  el.innerHTML = `<div class="box"><div class="tape">${tape}</div>
    <div class="big">${icon}</div>
    <h3>${head}</h3>
    <div class="amt">${money(amount)}</div>
    <p>${text}</p>
    <div class="bal">Your balance now: ${money(balance)}</div>
    <a class="go" href="casino.html">🎰 Go to the casino →</a>
    <button type="button" class="later">Later</button></div>`;
  document.body.appendChild(el);
  confetti(el);
  const close = () => el.remove();
  el.querySelector(".later").onclick = close;
  el.querySelector(".go").onclick = e => { if(page === "casino.html"){ e.preventDefault(); close(); } };
}
function winPopup(balance, page){
  if(document.getElementById("raffle")) return;
  const first = esc(String(me.name || "").split(" ")[0]);
  const [icon, why] = WINS[Math.floor(Math.random() * WINS.length)];
  const head = why.startsWith("your ") || why.startsWith("the ")
    ? (first ? first + ", " : "") + why + "!"
    : (first ? first + ", you " : "You ") + why + "!";
  bigWin(page, { tape: "🏆 WINNER 🏆", icon, head: head.charAt(0).toUpperCase() + head.slice(1), amount: RAFFLE.amount,
    text: "Your prize: " + money(RAFFLE.amount) + ", added to your casino balance. Go and spend it on the pokies and tables.", balance });
}

/* ---------- star swap ---------- */
async function myStars(){
  const c = await cloud(); if(!c) return null;
  const snap = await withTimeout(c.fs.getDoc(c.fs.doc(c.db, "xmas_scores", me.id)), 8000);
  return snap.exists() ? Math.max(0, Number(snap.data().total) || 0) : 0;
}
async function starOffer(page){
  const asked = "xmas_starswap_" + me.id;
  if(Date.now() - (+localStorage.getItem(asked) || 0) < SWAP.every) return;
  if(document.getElementById("raffle") || document.getElementById("kfile") || document.getElementById("xmas-sheet")) return;
  const stars = await myStars();
  if(stars === null || stars < SWAP.min) return;
  await linkCasino();
  if(!casinoUser() || document.getElementById("raffle")) return;
  localStorage.setItem(asked, String(Date.now()));
  winCSS();
  const opts = [...new Set([25, Math.floor(stars / 2), stars])].filter(n => n > 0 && n <= stars).sort((a, b) => a - b);
  const label = n => n === stars ? "Swap all " + n + " ⭐" : n === Math.floor(stars / 2) ? "Swap half — " + n + " ⭐" : "Swap " + n + " ⭐";
  const el = document.createElement("div"); el.id = "raffle"; el.className = "winpop"; el.setAttribute("role", "dialog");
  el.innerHTML = `<div class="box"><div class="tape">⭐ STAR SWAP ⭐</div>
    <div class="big">🌟</div>
    <h3>You've got ${stars} gold stars!</h3>
    <p>Want to cash some in for casino money? Today's rate is very kind:</p>
    <div class="amt" style="font-size:clamp(34px,11vw,46px)">1 ⭐ = ${money(SWAP.rate)}</div>
    <p class="deal">Usual rate <s>1 ⭐ = $5</s> · family special</p>
    ${opts.map(n => `<button type="button" class="go sm" data-n="${n}">${label(n)}<small>→ ${money(n * SWAP.rate)} casino money</small></button>`).join("")}
    <button type="button" class="later">No thanks, I'll keep my stars</button></div>`;
  document.body.appendChild(el);
  const close = () => el.remove();
  el.querySelector(".later").onclick = close;
  el.querySelectorAll("[data-n]").forEach(b => b.onclick = async () => {
    const n = +b.dataset.n;
    el.querySelectorAll("button").forEach(x => x.disabled = true);
    b.firstChild.textContent = "Swapping…";
    try{
      const bal = await swapStars(n);
      close();
      bigWin(page, { tape: "⭐ STARS SWAPPED ⭐", icon: "🤑", head: n + " stars swapped!", amount: n * SWAP.rate,
        text: "Added to your casino balance. Good luck out there.", balance: bal });
    }catch(e){
      close(); toast("Couldn't swap — " + (e && e.message || "try again later") + ". Your stars are safe.", 4000);
      localStorage.removeItem(asked);
    }
  });
}
/** Take n stars off, add the money to the casino. Puts the stars back if the casino says no. */
async function swapStars(n){
  const user = casinoUser(); if(!user) throw new Error("not signed in to the casino");
  const c = await cloud(); if(!c) throw new Error("no connection");
  const { fs, db } = c, ref = fs.doc(db, "xmas_scores", me.id);
  await withTimeout(fs.runTransaction(db, async t => {
    const snap = await t.get(ref);
    const have = snap.exists() ? Number(snap.data().total) || 0 : 0;
    if(have < n) throw new Error("you've only got " + have + " stars now");
    t.update(ref, { total: have - n, updated: Date.now() });
  }), 10000);
  let bal;
  try{ bal = await casinoAdd(user, n * SWAP.rate); if(bal === null || bal === false) throw new Error("casino account not found"); }
  catch(e){ await fs.setDoc(ref, { total: fs.increment(n), updated: Date.now() }, { merge:true }).catch(() => {}); throw e; }
  fs.addDoc(fs.collection(db, "xmas_starlog"), { who: me.id, kind: "swap", pts: -n, label: "Swapped for " + money(n * SWAP.rate) + " casino money", at: Date.now() }).catch(() => {});
  return bal;
}

/* ---------- heading to the casino ----------
   Leave a note saying which trip (and page) they came from, so the casino floor can offer a "Back to …"
   button — only ever for this trip. And if the casino sign-in above hasn't finished yet, hold the link
   for a moment so they arrive already signed in. */
const TRIP_NAME = "Townsend Christmas";
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("a[href]"); if(!a) return;
  const href = a.getAttribute("href") || "";
  const toCasino = a.dataset.game !== undefined || /(^|\/)Casino\//.test(href) || GAMES.some(g => href.endsWith(g.file));
  if(!toCasino) return;
  try{ localStorage.setItem("trip_return", JSON.stringify({ name: TRIP_NAME, url: location.href.split("#")[0], at: Date.now() })); }catch(err){}
  if(_casinoReady || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  // by the time we carry on, the other click handlers have picked the game, so a.href is the real destination
  Promise.race([linkCasino(), new Promise(r => setTimeout(r, 4000))]).then(() => { location.href = a.href; });
}, true);

/* ============================================================
   💬 CHAT — one family group chat ("Everyone") and a direct
   chat between any two people. Every message is one row in
   xmas_chat: { room, text, by, createdAt, to }. room is "all"
   for the group, or dmRoom(a, b) for two people (to = [a, b]).
   Anywhere a page shows someone's name with tapName(id), tapping
   it opens a direct chat with them in a sheet, right there.
   What you've read is kept on this phone, per chat.
   ============================================================ */
export const CHAT_ALL = "all";
export const dmRoom = (a, b) => "dm:" + [a, b].sort().join("|");
/** The other person in a direct chat (or "" for the group). */
export const dmOther = room => room.startsWith("dm:") ? (room.slice(3).split("|").find(id => !me || id !== me.id) || "") : "";
/** A person's name that opens a direct chat when tapped. Use in place of esc(pname(id)) inside innerHTML. */
export function tapName(id, label){
  const txt = esc(label ?? pname(id));
  if(!id || !me || id === me.id || !_people.some(p => p.id === id)) return txt;
  return `<span class="dm" data-dm="${esc(id)}" role="button" tabindex="0" title="Message ${esc(pname(id))}">${txt}</span>`;
}

let _chat = [], _chatOn = false, _chatFirst = true;
const _chatSubs = [], _chatKnown = new Set();
const seenKey = room => "xmas_chat_seen_" + (me ? me.id : "") + "_" + room;
export const chatSeenAt = room => +(localStorage.getItem(seenKey(room)) || 0);
export function chatSeen(room){
  const last = _chat.filter(m => m.room === room).reduce((t, m) => Math.max(t, m.createdAt || 0), Date.now());
  try{ localStorage.setItem(seenKey(room), String(last)); }catch(e){}
  paintChatBadge();
}
/** Is this message in a chat I'm part of? */
export const chatMine = m => m.room === CHAT_ALL || (!!me && Array.isArray(m.to) && m.to.includes(me.id));
/** Every message I can see, oldest first. */
export const chatRows = () => _chat;
export const chatUnread = room => _chat.filter(m => m.room === room && m.by !== (me && me.id) && (m.createdAt || 0) > chatSeenAt(room)).length;
export function chatUnreadAll(){
  const rooms = new Set(_chat.filter(chatMine).map(m => m.room));
  let n = 0; rooms.forEach(r => { n += chatUnread(r); }); return n;
}
/** Call cb() now and whenever a message comes in or goes. */
export function onChat(cb){ _chatSubs.push(cb); watchChat(); cb();
  return () => { const i = _chatSubs.indexOf(cb); if(i >= 0) _chatSubs.splice(i, 1); }; }
export async function sendChat(room, text){
  text = String(text || "").trim().slice(0, 1000); if(!text || !me) return;
  const row = { room, text };
  if(room !== CHAT_ALL) row.to = room.slice(3).split("|");
  await col("chat").add(row);
  try{ localStorage.setItem(seenKey(room), String(Date.now())); }catch(e){}
}
export const deleteChat = id => col("chat").remove(id);
let _openRoom = "";          // the chat on screen right now — it doesn't count as unread or pop up
export const chatViewing = room => { _openRoom = room; };

function watchChat(){
  if(_chatOn) return; _chatOn = true;
  col("chat").subscribe(rows => {
    _chat = rows.filter(chatMine).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if(!_chatFirst){
      // a new direct message for me, while I'm somewhere else — pop it up
      const fresh = _chat.filter(m => !_chatKnown.has(m.id) && m.room !== CHAT_ALL && m.by !== (me && me.id) && m.room !== _openRoom
                                     && Date.now() - (m.createdAt || 0) < 120000);
      if(fresh.length) chatPop(fresh[fresh.length - 1]);
    }
    _chat.forEach(m => _chatKnown.add(m.id)); _chatFirst = false;
    paintChatBadge();
    _chatSubs.forEach(cb => cb());
  });
}
function paintChatBadge(){
  const n = chatUnreadAll();
  document.querySelectorAll(".chatn").forEach(b => { b.textContent = n > 99 ? "99+" : String(n); b.classList.toggle("hide", !n); });
}
function chatPop(m){
  document.getElementById("chatpop")?.remove();
  const el = document.createElement("button"); el.id = "chatpop"; el.className = "chatpop";
  el.innerHTML = `<b>💬 ${esc(pname(m.by))}</b><span>${esc(m.text)}</span>`;
  el.onclick = () => { el.remove(); openDm(m.by); };
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 7000);
}

export const chatTime = t => { if(!t) return ""; const d = new Date(t), now = new Date();
  const tm = d.toLocaleTimeString("en-NZ", { hour:"numeric", minute:"2-digit" });
  return d.toDateString() === now.toDateString() ? tm : d.toLocaleDateString("en-NZ", { weekday:"short", day:"numeric", month:"short" }) + " " + tm; };
/** The bubbles for one chat. names = show who sent each one (for the group). */
export function chatBubbles(room, names){
  const ms = _chat.filter(m => m.room === room);
  if(!ms.length) return `<div class="empty">No messages yet — say g'day 👋</div>`;
  let lastBy = null;
  return ms.map(m => { const mine = me && m.by === me.id, showName = names && !mine && m.by !== lastBy; lastBy = m.by;
    return `<div class="msg${mine ? " me" : ""}" data-msg="${esc(m.id)}">${showName ? `<div class="from">${badge(m.by)} ${tapName(m.by)}</div>` : ""}
      <div class="bub">${esc(m.text)}</div><div class="at">${chatTime(m.createdAt)}</div></div>`; }).join("");
}

/** A direct chat with this person, in a sheet over whatever page you're on. */
export function openDm(id){
  if(!me || id === me.id) return;
  const room = dmRoom(me.id, id), p = person(id);
  const sh = openSheet(`<div class="dmhead">${badge(id)}<h3>${esc(p.label)}</h3><a class="chip" href="chat.html?with=${encodeURIComponent(id)}">Open in Chat →</a></div>
    <div class="dmlog" id="dmLog"></div>
    <form class="composer insheet" id="dmForm"><textarea class="in" id="dmText" rows="1" maxlength="1000" placeholder="Message ${esc(p.name)}…"></textarea>
    <button class="btn red" aria-label="Send">Send</button></form>`, () => { stop(); if(_openRoom === room) _openRoom = ""; });
  let stop = () => {};
  const q = s => sh.el.querySelector(s);
  const paint = () => { q("#dmLog").innerHTML = chatBubbles(room, false); q("#dmLog").scrollTop = 1e9; chatSeen(room); };
  _openRoom = room;
  stop = onChat(paint);
  chatForm(q("#dmForm"), q("#dmText"), room);
}
/** Wire up a message box: Enter sends on a computer, the button sends anywhere. */
export function chatForm(form, box, room){
  const grow = () => { box.style.height = "auto"; box.style.height = Math.min(box.scrollHeight, 130) + "px"; };
  box.addEventListener("input", grow);
  box.addEventListener("keydown", e => { if(e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)){ e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = box.value.trim(); if(!text) return;
    const r = typeof room === "function" ? room() : room;
    box.value = ""; grow();
    try{ await sendChat(r, text); }catch(err){ box.value = text; toast("Couldn't send it — " + err.message); }
  });
}
// tap any name (tapName(id)) to message them — even inside a card that does something else when tapped
document.addEventListener("click", e => {
  const t = e.target.closest && e.target.closest("[data-dm]"); if(!t) return;
  e.preventDefault(); e.stopPropagation(); openDm(t.dataset.dm);
}, true);
document.addEventListener("keydown", e => {
  if(e.key !== "Enter" && e.key !== " ") return;
  const t = e.target.closest && e.target.closest("[data-dm]"); if(!t) return;
  e.preventDefault(); e.stopPropagation(); openDm(t.dataset.dm);
}, true);

/* ============================================================
   PAGE FURNITURE — nav, showcase, toast, banner, sheets, header
   ============================================================ */
const NAV = [
  ["home.html",    "🏠", "Home"],
  ["chat.html",    "💬", "Chat"],
  ["planner.html", "🗓️", "Plan"],
  ["food.html",    "🍤", "Food"],
  ["fun.html",     "🏆", "Games"],
  ["photos.html",  "📸", "Photos"]
];   // the last slot is the showcase — see THE SHOWCASE below

/* ---------- no pokies, thanks ----------
   Some people would rather not see the casino at all. For them nothing pokie-shaped is put on any page:
   no strips, no floating machine, no nav button, no casino tile, and the casino page sends them home.
   NO_POKIES is on from the first visit; anyone else can switch it for themselves on the home page. */
export const NO_POKIES = ["h02-topsy"];
let _quiet = {};
/** True if this person (default: whoever's signed in) shouldn't be shown any pokies or casino links. */
export function noPokies(id = me && me.id){
  if(!id) return false;
  if(id in _quiet) return !!_quiet[id];
  if(me && id === me.id && localStorage.getItem("xmas_nopokies_" + id) !== null) return localStorage.getItem("xmas_nopokies_" + id) === "1";
  return NO_POKIES.includes(id);
}
/** Is this person on the built-in list (so we never show them a switch that mentions it)? */
export const noPokiesFixed = (id = me && me.id) => NO_POKIES.includes(id);
export async function setNoPokies(on){
  if(!me) return;
  localStorage.setItem("xmas_nopokies_" + me.id, on ? "1" : "0"); _quiet[me.id] = !!on;
  document.body.classList.toggle("nopokies", !!on);
  dispatchEvent(new Event("xmas-showcase"));   // if today's showcase is the pokies, swap to the next app for them
  await settings("quiet").save({ [me.id]: !!on });
}
settings("quiet").subscribe(q => {
  _quiet = q ? Object.fromEntries(Object.entries(q).filter(([k]) => k !== "id")) : {};
  if(me && me.id in _quiet){ localStorage.setItem("xmas_nopokies_" + me.id, _quiet[me.id] ? "1" : "0"); document.body.classList.toggle("nopokies", !!_quiet[me.id]); }
  dispatchEvent(new Event("xmas-showcase"));
});

/* ============================================================
   REPORT-A-TRAUMA — a family in-joke (it started life as the
   Kristy Files). Every so often a pop-up asks whoever's signed in
   to anonymously report a past "traumatic event" caused by any
   other family member. Reports are saved with the culprit but no
   reporter name, and stay sealed on trauma.html until an organiser
   unlocks them with the PIN for the big reveal at camp.
   Nothing here earns gold stars — the stars feed has names on it.
   Reports filed back when it was the Kristy Files live in "kristy"
   and are shown with Kristy as the culprit.
   ============================================================ */
export const KRISTY = "h09-kristy";
/* "Don't show me this again": a person's choice is saved on the shared site, so it follows them to any phone.
   They still get the baby-photo pop-ups. They can turn it back on from the Report-a-trauma page.
   (Saved under the old "nokristy" name so earlier choices carry over.) */
let _traumaOff = {};
settings("nokristy").subscribe(d => { _traumaOff = d ? Object.fromEntries(Object.entries(d).filter(([k]) => k !== "id")) : {}; dispatchEvent(new Event("xmas-traumaoff")); });
export const traumaOff = (id = me && me.id) => !!id && (id in _traumaOff ? !!_traumaOff[id] : localStorage.getItem("xmas_nokristy_" + id) === "1");
export async function setTraumaOff(on){
  if(!me) return;
  try{ localStorage.setItem("xmas_nokristy_" + me.id, on ? "1" : "0"); }catch(e){}
  _traumaOff[me.id] = !!on; dispatchEvent(new Event("xmas-traumaoff"));
  await settings("nokristy").save({ [me.id]: !!on });
}
export const TRAUMA_SCALE = ["Mildly scarred", "Still not over it", "Brought up at every Christmas", "Family legend"];
/* {n} is swapped for a name. Pop-ups suggest someone at random; the person can change it. */
const TRAUMA_LINES = [
  ["Have you been affected by {n}?", "You are not alone. Our records suggest most of the family has."],
  ["Family Trauma Hotline", "A trained listener (this form) is standing by."],
  ["It's time to talk about what {n} did", "Healing starts with paperwork."],
  ["Compensation may be available*", "*It isn't. But we'd still like to hear what {n} did."],
  ["We noticed you've met {n}", "Would you like to report an incident?"],
  ["Urgent: unreported incident on file", "Our system shows you are holding one back about {n}."]
];
const TRAUMA_DODGES = ["Not now", "I'm not ready to talk", "It's still too raw", "I've blocked it out", "Ask me after a drink"];
/** Everyone except me, A–Z. */
export const otherPeople = () => people().filter(p => !me || p.id !== me.id).sort((a, b) => a.label.localeCompare(b.label));
function popupCSS(){
  if(!document.getElementById("kfile-css")){
    const st = document.createElement("style"); st.id = "kfile-css";
    st.textContent = `#kfile{position:fixed;inset:0;z-index:72;display:grid;place-items:center;padding:16px;background:rgba(18,48,59,.62);animation:kf-in .25s ease}
@keyframes kf-in{from{opacity:0}}
#kfile .box{width:100%;max-width:400px;max-height:92vh;overflow:auto;background:#FFFDF6;border-radius:18px;border:3px solid #D8352A;
 box-shadow:0 24px 60px -18px rgba(0,0,0,.7);padding:0 16px 16px;animation:kf-pop .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes kf-pop{from{transform:scale(.8) rotate(-2deg)}}
#kfile .tape{margin:0 -16px 12px;padding:7px 10px;text-align:center;font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.18em;font-weight:500;
 color:#12303B;background:repeating-linear-gradient(-45deg,#F2B33D 0 14px,#12303B 14px 16px,#F2B33D 16px 30px)}
#kfile .tape span{background:#F2B33D;padding:2px 8px;border-radius:4px}
#kfile h3{font-family:'Fraunces',serif;font-weight:900;font-size:23px;line-height:1.1;margin:0 0 4px;color:#D8352A}
#kfile p{margin:0 0 8px;font-size:14px;color:#3E5A63}
#kfile .anon{font-size:12px;background:#EEF7F2;border:1px solid #B5DDC5;border-radius:10px;padding:7px 9px;color:#1F5A45}
#kfile .sev{display:flex;flex-wrap:wrap;gap:6px}
#kfile .acts{display:flex;gap:8px;margin-top:14px}#kfile .acts .btn{flex:1}
#kfile .sosbtn{display:block;width:100%;margin-top:10px;padding:10px 12px;border-radius:12px;border:2px dashed #D8352A;background:#FFF1EE;color:#B0251C;font-weight:600;font-size:14px}
#kfile.baby .box{border-color:#1AA5B8}
#kfile.baby h3{color:#0E7C86}
#kfile.baby .tape{background:repeating-linear-gradient(-45deg,#FFC6D9 0 14px,#fff 14px 16px,#BFE9F0 16px 30px)}
#kfile.baby .tape span{background:#fff}
#kfile .babypic{display:block;width:100%;max-height:46vh;object-fit:contain;border-radius:12px;background:#F7E8CF;margin:4px 0 10px;min-height:120px}`;
    document.head.appendChild(st);
  }
}
/** Open the report form. suggest = true from the random pop-up (picks a culprit at random), or a person id. */
export function reportTrauma(suggest){
  if(!me || document.getElementById("kfile")) return;
  popupCSS();
  const others = otherPeople();
  let pick = typeof suggest === "string" ? suggest : suggest === true && others.length ? others[Math.floor(Math.random() * others.length)].id : "";
  const nameOf = () => pick ? pname(pick) : "a family member";
  const [head, sub] = TRAUMA_LINES[Math.floor(Math.random() * TRAUMA_LINES.length)];
  const el = document.createElement("div"); el.id = "kfile"; el.setAttribute("role", "dialog");
  el.innerHTML = `<div class="box"><div class="tape"><span>🚨 REPORT-A-TRAUMA 🚨</span></div>
    <h3 id="kfHead"></h3><p id="kfSub"></p>
    <label class="f" for="kfWho">Who did it?</label>
    <select class="in" id="kfWho"><option value="">Choose the culprit…</option>${others.map(p => `<option value="${esc(p.id)}"${p.id === pick ? " selected" : ""}>${esc(p.label)}</option>`).join("")}</select>
    <label class="f" for="kfStory">What did they do? (the past incident, in your own words)</label>
    <textarea class="in" id="kfStory" maxlength="600" placeholder="It was Christmas, 1998. I had just been handed the trifle…"></textarea>
    <label class="f" for="kfWhen">Roughly when?</label>
    <input class="in" id="kfWhen" maxlength="40" placeholder="e.g. 2009, or 'the Coffs Harbour trip'">
    <label class="f">How are you coping?</label>
    <div class="sev">${TRAUMA_SCALE.map((x, i) => `<button type="button" class="chip${i === 1 ? " on" : ""}" data-sev="${i}">${x}</button>`).join("")}</div>
    <button type="button" class="sosbtn" id="kfSos">🆘 I need a counsellor / drink / my medication ASAP</button>
    <p class="anon" style="margin-top:12px">🔒 Truly anonymous — your name is not saved with this. Reports stay sealed until the organisers open them at camp. Keep it kind: the culprit will hear every one.</p>
    <div class="acts"><button class="btn ghost" id="kfNo">${TRAUMA_DODGES[Math.floor(Math.random() * TRAUMA_DODGES.length)]}</button><button class="btn red" id="kfGo">Submit report</button></div>
    <button type="button" id="kfNever" style="display:block;margin:12px auto 0;background:none;border:0;color:#3E5A63;font-size:13px;text-decoration:underline;text-underline-offset:3px">Don't show me this again</button></div>`;
  document.body.appendChild(el);
  const paintHead = () => { el.querySelector("#kfHead").textContent = head.replace("{n}", nameOf()); el.querySelector("#kfSub").textContent = sub.replace("{n}", nameOf()); };
  paintHead();
  el.querySelector("#kfWho").onchange = e => { pick = e.target.value; paintHead(); };
  let sev = 1;
  el.querySelector(".sev").addEventListener("click", e => { const b = e.target.closest("[data-sev]"); if(!b) return;
    sev = +b.dataset.sev; el.querySelectorAll("[data-sev]").forEach(x => x.classList.toggle("on", x === b)); });
  const close = () => el.remove();
  el.querySelector("#kfNo").onclick = close;
  el.querySelector("#kfSos").onclick = () => needHelp();
  el.querySelector("#kfNever").onclick = async () => {
    close(); toast("Done — no more trauma pop-ups for you. You can turn them back on from the Report-a-trauma page.", 4500);
    try{ await setTraumaOff(true); }catch(e){ toast("Saved on this phone only — " + e.message); }
  };
  el.querySelector("#kfGo").onclick = async () => {
    if(!pick){ toast("Who did it? Pick the culprit."); return; }
    const story = el.querySelector("#kfStory").value.trim();
    if(story.length < 5){ toast("Take your time. Tell us what " + nameOf() + " did."); return; }
    const when = el.querySelector("#kfWhen").value.trim();
    close(); jingle(); toast("Report filed. Thank you for your bravery.", 3600);
    // set() with our own id rather than add(): add() would stamp the reporter's name on it
    try{ await col("trauma").set(uid(), { culprit: pick, story, when, sev, n: Math.random() }); }
    catch(e){ toast("Couldn't file it — " + e.message); }
  };
}

/* ============================================================
   🆘 I NEED A COUNSELLOR / DRINK / MY MEDICATION ASAP
   Sends a "flare" with your name on it. Flares show on the home
   page and the Report-a-trauma page for 3 hours, until someone
   taps "I'm on it" and the sender taps "Sorted".
   ============================================================ */
export const SOS = { counsellor:["🛋️", "a counsellor"], drink:["🍷", "a drink"], meds:["💊", "their medication"] };
export const SOS_FOR = 3 * 3600000;
export function needHelp(){
  if(!me) return;
  const sh = openSheet(`<h3 style="font-family:'Fraunces',serif;font-weight:900;font-size:24px;margin:4px 0 2px;color:var(--red)">🆘 What do you need, ASAP?</h3>
    <p class="small muted" style="margin:0 0 12px">Sends a flare to the family with your name on it. Someone will be along shortly (probably).</p>
    <div style="display:grid;gap:8px">
      <button class="btn wide" data-sos="counsellor" style="font-size:17px;padding:14px">🛋️ A counsellor</button>
      <button class="btn wide" data-sos="drink" style="font-size:17px;padding:14px">🍷 A drink</button>
      <button class="btn wide" data-sos="meds" style="font-size:17px;padding:14px">💊 My medication</button>
    </div>
    <p class="small muted" style="text-align:center;margin:14px 0 0">Actually not okay? Lifeline is 13 11 14, any time.</p>`);
  // sit above the report pop-up when it's opened from there, so what they've typed isn't lost
  sh.el.style.zIndex = 74; const scrim = document.getElementById("xmas-scrim"); if(scrim) scrim.style.zIndex = 73;
  sh.el.addEventListener("click", async e => { const b = e.target.closest("[data-sos]"); if(!b) return;
    sh.close(); jingle(); toast(`Flare sent. Hold on — ${SOS[b.dataset.sos][1].replace("their", "your")} is on the way.`, 3600);
    try{ await col("sos").add({ what: b.dataset.sos }); }catch(err){ toast("Couldn't send it — " + err.message); } });
}
/** Show the live flares in this element (hidden when there are none). */
export function sosWatch(el){
  if(!el) return;
  let rows = [];
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.floor(m / 60) + " h ago"; };
  const paint = () => {
    const live = rows.filter(r => r.createdAt && Date.now() - r.createdAt < SOS_FOR && !r.done).sort((a, b) => b.createdAt - a.createdAt);
    el.classList.toggle("hide", !live.length);
    el.innerHTML = live.map(r => { const [g, what] = SOS[r.what] || SOS.drink, mine = me && r.by === me.id;
      return `<div class="tag red" style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
        <b style="font-size:26px">${g}</b>
        <div style="flex:1;min-width:0"><b>${mine ? "You need" : tapName(r.by) + " needs"} ${esc(mine ? what.replace("their", "your") : what)} ASAP</b>
          <div class="small muted">${ago(r.createdAt)}${r.helper ? ` · ${esc(me && r.helper === me.id ? "you're" : pname(r.helper) + " is")} on it` : ""}</div></div>
        ${mine ? `<button class="chip" data-sosdone="${r.id}">Sorted</button>`
               : r.helper ? "" : `<button class="chip" data-sosgo="${r.id}">I'm on it</button>`}</div>`; }).join("");
  };
  col("sos").subscribe(r => { rows = r; paint(); });
  setInterval(paint, 60000);
  el.addEventListener("click", async e => {
    const go = e.target.closest("[data-sosgo]"), done = e.target.closest("[data-sosdone]");
    try{
      if(go){ await col("sos").update(go.dataset.sosgo, { helper: me.id }); toast("Go on then — they're waiting"); }
      if(done){ await col("sos").update(done.dataset.sosdone, { done: true }); toast("Glad you're sorted"); }
    }catch(err){ toast("Couldn't save that — " + err.message); }
  });
}
/* ============================================================
   WHO'S THE BABY — Kay's competition. Kay (or an organiser with
   the PIN) uploads baby photos on babies.html; everyone else gets
   prompted now and then to guess who each baby is. Each person
   has one guess per photo (they can change it). Only Kay and the
   organisers see the guesses and the answers.
   Photos live in two places: "babies" holds the small details
   ({n}) so it's quick to load anywhere, "babyimg" holds each picture.
   ============================================================ */
export const KAY = "h07-kay";
export const isKay = () => !!me && me.id === KAY;
export const guessId = (photoId, who) => photoId + "_" + who;
const BABY_LINES = [
  ["Who's this little one?", "Kay's Guess the Baby comp is open. Your best guess, please."],
  ["Kay needs your help", "She's lost track of whose baby photo this is. (She hasn't.)"],
  ["Cute! But who is it?", "One of the family, before the bad haircuts."],
  ["Name that baby", "Bragging rights at Kay's photo booth on Christmas Eve."],
  ["Recognise those cheeks?", "Type a name — first names are fine."],
  ["Baby on board", "Who grew up to be this lot?"]
];
const BABY_DODGES = ["No idea", "Skip this one", "Pass", "Give me a minute", "Ask me later"];
let _babies = null, _myGuesses = null, _babyWatch = false;
function watchBabies(){
  if(_babyWatch || !me) return; _babyWatch = true;
  col("babies").subscribe(r => { _babies = r; });
  col("babyguess").subscribe(r => { _myGuesses = new Set(r.filter(g => g.who === me.id).map(g => g.photo)); });
}
/** A photo this person hasn't guessed yet, or null. Kay never gets asked. */
function nextBaby(){
  if(isKay() || !_babies || !_myGuesses) return null;
  const left = _babies.filter(b => !_myGuesses.has(b.id));
  return left.length ? left[Math.floor(Math.random() * left.length)] : null;
}
/** Show the guess pop-up for one photo (or a random unguessed one). Resolves true if it showed. */
export async function guessBaby(photo){
  photo = photo || nextBaby();
  if(!photo || isKay() || document.getElementById("kfile")) return false;
  let img = null; try{ img = await col("babyimg").get(photo.id); }catch(e){}
  if(!img || !img.data || document.getElementById("kfile")) return false;
  popupCSS();
  const [head, sub] = BABY_LINES[Math.floor(Math.random() * BABY_LINES.length)];
  const names = [...new Set(people().map(p => p.name))].sort();
  const el = document.createElement("div"); el.id = "kfile"; el.className = "baby"; el.setAttribute("role", "dialog");
  el.innerHTML = `<div class="box"><div class="tape"><span>👶 WHO'S THE BABY? · No. ${esc(photo.n || "?")} 👶</span></div>
    <h3>${esc(head)}</h3><p>${esc(sub)}</p>
    <img class="babypic" alt="Baby photo number ${esc(photo.n || "")}" src="${img.data}">
    <label class="f" for="bbGuess">Who is it?</label>
    <input class="in" id="bbGuess" maxlength="40" list="bbNames" autocomplete="off" placeholder="Type a name">
    <datalist id="bbNames">${names.map(n => `<option value="${esc(n)}">`).join("")}</datalist>
    <p class="anon" style="margin-top:12px">🤫 Only Kay and the organisers can see your guess. Answers are revealed at Kay's photo booth.</p>
    <div class="acts"><button class="btn ghost" id="bbNo">${BABY_DODGES[Math.floor(Math.random() * BABY_DODGES.length)]}</button><button class="btn red" id="bbGo">Submit guess</button></div></div>`;
  document.body.appendChild(el);
  const close = () => el.remove();
  el.querySelector("#bbNo").onclick = close;
  const go = async () => {
    const guess = el.querySelector("#bbGuess").value.trim();
    if(!guess){ toast("Have a guess — any name will do"); return; }
    close(); celebrate("guess");
    if(_myGuesses) _myGuesses.add(photo.id);
    try{ await col("babyguess").set(guessId(photo.id, me.id), { photo: photo.id, who: me.id, guess, at: Date.now() }); }
    catch(e){ toast("Couldn't save your guess — " + e.message); }
  };
  el.querySelector("#bbGo").onclick = go;
  el.querySelector("#bbGuess").addEventListener("keydown", e => { if(e.key === "Enter") go(); });
  return true;
}

const once = name => new Promise(res => { let done = false; col(name).subscribe(r => { if(!done){ done = true; res(r); } }); });
/** Kay's upload: shrink each photo, number it after the ones already up, save it. progress(done, total, finished). */
export async function addBabyPhotos(files, progress = () => {}){
  files = [...files]; if(!files.length) return 0;
  const existing = await once("babies");
  let n = existing.reduce((m, b) => Math.max(m, b.n || 0), 0), done = 0; const first = n + 1, added = [];
  for(const f of files){
    progress(done, files.length, false);
    try{
      const data = await compressImage(f, 1100, 180 * 1024);
      const id = "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await col("babyimg").set(id, { data });
      await col("babies").set(id, { n: ++n, by: me.id, createdAt: Date.now() });
      added.push({ id, n, data }); done++;
    }catch(e){ toast("Couldn't add one photo — " + e.message); }
  }
  progress(done, files.length, true);
  if(done){ celebrate("photo"); setTimeout(() => askBabyNames(added), 900); }    // let the stars finish first
  return done;
}
/** Straight after an upload: show each new photo in turn and ask Kay who the baby is. Skipping is fine —
 *  she can fill it in later on the Guess the Baby page. */
export function askBabyNames(list){
  const names = [...new Set(people().map(p => p.name))].sort();
  let i = 0, saved = 0;
  const step = () => {
    if(i >= list.length){ closeSheet(); toast(saved === list.length ? "All named ✓ — the guesses will tick themselves" : `${saved} of ${list.length} named. Fill in the rest on the Guess the Baby page.`, 4200); return; }
    const b = list[i], last = i === list.length - 1;
    const sh = openSheet(`<h3>Who's baby No. ${b.n}?</h3>
      <p class="muted small" style="margin:0 0 8px">${list.length > 1 ? `Photo ${i + 1} of ${list.length} · ` : ""}Only you and the organisers will see this.</p>
      <img src="${b.data}" alt="Baby No. ${b.n}" style="display:block;width:100%;max-height:42vh;object-fit:contain;border-radius:12px;background:#F7E8CF">
      <label class="f" for="bnName">Their name</label>
      <input class="in" id="bnName" list="bnList" autocomplete="off" maxlength="40" placeholder="e.g. Georgia">
      <datalist id="bnList">${names.map(n => `<option value="${esc(n)}">`).join("")}</datalist>
      <div class="acts"><button class="btn ghost" id="bnSkip">${last ? "Skip" : "Skip this one"}</button><button class="btn red" id="bnGo">${last ? "Save" : "Save & next"}</button></div>`);
    const go = async () => {
      const v = sh.el.querySelector("#bnName").value.trim();
      if(!v){ sh.el.querySelector("#bnName").focus(); toast("Type a name, or tap Skip"); return; }
      try{ await col("babykey").set(b.id, { answer: v }); saved++; }catch(e){ toast("Couldn't save — " + e.message); return; }
      i++; step();
    };
    sh.el.querySelector("#bnGo").onclick = go;
    sh.el.querySelector("#bnName").addEventListener("keydown", e => { if(e.key === "Enter") go(); });
    sh.el.querySelector("#bnSkip").onclick = () => { i++; step(); };
    setTimeout(() => sh.el.querySelector("#bnName")?.focus(), 250);
  };
  step();
}

/* the random pop-up: about every third page, never twice within 45 seconds, never over another sheet.
   Four times in five it's a baby photo to guess, once in five it's Report-a-trauma. If there's no baby
   photo left for this person it falls back to the trauma report (unless they've switched it off). */
function promptWatch(page){
  if(["kristy.html", "trauma.html", "babies.html", "traffic.html", "where.html"].includes(page)) return;
  if(isKay()) return;          // Kay runs the baby comp and doesn't want the trauma one either — no pop-ups for her
  watchBabies();
  const last = +(sessionStorage.getItem("xmas_kfile_at") || 0);
  if(Date.now() - last < 45000 || Math.random() > 0.36) return;
  setTimeout(async () => {
    if(document.getElementById("xmas-sheet") || document.querySelector(".lightbox") || document.getElementById("kfile") || document.getElementById("raffle") || document.hidden) return;
    sessionStorage.setItem("xmas_kfile_at", String(Date.now()));
    const wantBaby = Math.random() < 0.8;
    if(wantBaby && await guessBaby()) return;
    if(!traumaOff()) reportTrauma(true);
    else if(!wantBaby) await guessBaby();
  }, 2500 + Math.random() * 3500);
}

/* ============================================================
   ADD TO HOME SCREEN — a card that makes it one tap where the
   phone allows it (Android / Chrome), and shows the two taps to
   do by hand where it doesn't (iPhone). Never shown once the site
   is already running from the home screen.
   ============================================================ */
let _installEvt = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); _installEvt = e; document.querySelectorAll(".installcard").forEach(c => c.classList.remove("hide")); });
addEventListener("appinstalled", () => { document.querySelectorAll(".installcard").forEach(c => c.remove()); try{ localStorage.setItem("xmas_installed", "1"); }catch(e){} });
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
/** Put the "add to home screen" card at the top of this element. dark = for the photo-backed front page. */
export function installCard(parent, dark = false){
  if(parent !== null && (!parent || isStandalone() || localStorage.getItem("xmas_installed") === "1" || +localStorage.getItem("xmas_install_no") > Date.now())) return;
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const iosOther = ios && /CriOS|FxiOS|EdgiOS/.test(ua);
  if(!document.getElementById("install-css")){
    const st = document.createElement("style"); st.id = "install-css";
    st.textContent = `.installcard{display:flex;align-items:center;gap:11px;border-radius:16px;padding:11px 12px;margin:0 0 16px;text-align:left;width:100%;max-width:460px;
 background:#fff;border:1px solid #EAD9BC;color:#12303B;box-shadow:0 2px 0 rgba(18,48,59,.08),0 10px 26px -14px rgba(18,48,59,.45)}
.installcard.dark{background:rgba(255,255,255,.94);margin:14px auto 0}
.installcard img{width:42px;height:42px;border-radius:11px;flex:none;border:1px solid #EAD9BC}
.installcard .tx{flex:1;min-width:0;font-size:13px;line-height:1.3}.installcard .tx b{display:block;font-size:14.5px}
.installcard .go{flex:none;border:0;border-radius:10px;background:#1F8A5B;color:#fff;font:600 14px/1 inherit;padding:10px 13px}
.installcard .x{flex:none;border:0;background:none;font-size:20px;line-height:1;color:#3E5A63;padding:2px 2px}
.installsteps{margin:10px 0 0;padding:0;list-style:none;counter-reset:s}
.installsteps li{counter-increment:s;display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px dashed #EAD9BC;font-size:16px;line-height:1.35}
.installsteps li::before{content:counter(s);flex:none;width:28px;height:28px;border-radius:50%;background:#12303B;color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px}
.installsteps svg{width:20px;height:20px;vertical-align:-4px;margin:0 2px}`;
    // the front page doesn't load app.css, so give the "how to" sheet its own look there
    if(!document.querySelector('link[href*="app.css"]')) st.textContent += `
#xmas-scrim{position:fixed;inset:0;background:rgba(18,48,59,.45);z-index:70}
#xmas-sheet{position:fixed;left:0;right:0;bottom:0;z-index:71;background:#FFF7EA;color:#12303B;text-align:left;font-family:'Outfit',system-ui,sans-serif;font-size:16px;line-height:1.45;
 border-radius:20px 20px 0 0;max-height:88vh;overflow:auto;padding:16px 16px calc(20px + env(safe-area-inset-bottom));max-width:640px;margin:0 auto;box-shadow:0 -12px 40px -10px rgba(18,48,59,.45)}
#xmas-sheet *{box-sizing:border-box}
#xmas-sheet h3{font-family:'Fraunces',serif;font-weight:700;font-size:22px;margin:4px 0 6px;color:#12303B}
#xmas-sheet .grab{width:44px;height:5px;border-radius:5px;background:#EAD9BC;margin:0 auto 10px}
#xmas-sheet .acts{display:flex;gap:10px;margin-top:16px} #xmas-sheet .acts .btn{flex:1}
#xmas-sheet .btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:12px;padding:11px 16px;font:600 15px 'Outfit',system-ui,sans-serif;background:#12303B;color:#FFF7EA;text-decoration:none}
#xmas-sheet .btn.ghost{background:transparent;color:#12303B;border:1.5px solid #EAD9BC} #xmas-sheet .btn.wide{width:100%}
#xmas-sheet .banner{background:#FFF1D0;border:1px solid #F2B33D;border-radius:12px;padding:10px 12px;font-size:13.5px;margin:0 0 14px}
#xmas-sheet .muted{color:#3E5A63;opacity:.8} #xmas-sheet .small{font-size:13px}
#xmas-toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:95;background:#12303B;color:#FFF7EA;border-radius:12px;padding:10px 16px;font-size:14px;max-width:90vw;text-align:center}
#xmas-toast.hide{display:none}`;
    document.head.appendChild(st);
  }
  if(parent === null) return;
  const c = document.createElement("div"); c.className = "installcard" + (dark ? " dark" : "");
  c.innerHTML = `<img src="icon-192.png" alt=""><span class="tx"><b>Put this on your phone</b>One tap on your home screen, like an app.</span>
    <button class="go">Add</button><button class="x" aria-label="Not now">×</button>`;
  parent.prepend(c);
  c.querySelector(".x").onclick = () => { c.remove(); try{ localStorage.setItem("xmas_install_no", String(Date.now() + 3 * 86400000)); }catch(e){} };
  c.querySelector(".go").onclick = async () => { if(await addToHomeScreen()) c.remove(); };
}
/** True when the site is already running from the home screen. */
export const onHomeScreen = isStandalone;
/** "Add to home screen": the phone's own install prompt where there is one (Android), otherwise the steps.
 *  Resolves true if it was installed there and then. */
export async function addToHomeScreen(){
    const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const iosOther = ios && /CriOS|FxiOS|EdgiOS/.test(ua), inApp = /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|WhatsApp|Line\//.test(ua);
    if(_installEvt){ _installEvt.prompt(); const r = await _installEvt.userChoice.catch(() => null); _installEvt = null; return !!(r && r.outcome === "accepted"); }
    if(!document.getElementById("install-css")) installCard(null);      // load the styles
    const share = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>`;
    const steps = ios
      ? [iosOther ? `Tap the <b>Share</b> button ${share} (in the address bar at the top).` : `Tap the <b>Share</b> button ${share} at the bottom of Safari.`,
         `Scroll down and tap <b>Add to Home Screen</b>.`, `Tap <b>Add</b>. Look for the Christmas logo on your home screen.`]
      : [`Tap the <b>⋮</b> menu at the top right of your browser.`, `Tap <b>Add to Home screen</b> (or <b>Install app</b>).`, `Tap <b>Add</b>. Look for the Christmas logo on your home screen.`];
    if(inApp){ inAppEscape(ua, ios, steps); return false; }
    openSheet(`<h3>Add to your home screen</h3><p class="muted small">It takes about ten seconds and you only do it once.</p>
      <ol class="installsteps">${steps.map(s => `<li><span>${s}</span></li>`).join("")}</ol>
      <div class="acts"><button class="btn" id="insOk">Got it</button></div>`).el.querySelector("#insOk").onclick = closeSheet;
    return false;
}


/** Inside Messenger / Facebook / Instagram's own browser there is no "Add to Home Screen", and on iPhone the
 *  ⋯ menu often has no "Open in Safari" either. So: a button that jumps straight to Safari (x-safari-https,
 *  iOS 17+) or Chrome (intent://, Android), plus "Copy link" to paste into Safari by hand. */
function inAppEscape(ua, ios, steps){
  const app = /Messenger|Orca-Android|FB_IAB\/MESSENGER/i.test(ua) ? "Messenger" : /Instagram/.test(ua) ? "Instagram" : /WhatsApp/.test(ua) ? "WhatsApp" : /FBAN|FBAV|FB_IAB|FBIOS/.test(ua) ? "Facebook" : "another app";
  const u = new URL(location.href); ["fbclid", "mibextid"].forEach(k => u.searchParams.delete(k)); u.hash = "";
  const link = u.href, browser = ios ? "Safari" : "Chrome";
  const jump = ios ? "x-safari-" + link
    : `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(link)};end`;
  const sh = openSheet(`<h3>Add to your home screen</h3>
    <p class="banner">You opened this inside <b>${app}</b>. Its browser can't add to your home screen, so open the site in <b>${browser}</b> first.</p>
    <a class="btn wide" href="${esc(jump)}" style="display:block;text-align:center;text-decoration:none">Open in ${browser}</a>
    <p class="muted small" style="margin:12px 0 6px">Didn't open? Copy the link, open ${browser}, tap the address bar, paste and go.</p>
    <input id="insLink" readonly value="${esc(link)}" style="width:100%;font-size:14px;padding:9px 10px;border:1.5px solid #EAD9BC;border-radius:10px;margin-bottom:8px">
    <button class="btn ghost wide" id="insCopy">Copy link</button>
    <p class="muted small" style="margin:14px 0 0">Then, in ${browser}:</p>
    <ol class="installsteps">${steps.map(s => `<li><span>${s}</span></li>`).join("")}</ol>
    <p class="muted small" style="margin-top:6px">You might need to tap your name again in ${browser} - that's normal.</p>
    <div class="acts"><button class="btn" id="insOk">Close</button></div>`);
  const inp = sh.el.querySelector("#insLink");
  inp.onfocus = () => inp.select();
  sh.el.querySelector("#insCopy").onclick = async () => {
    let ok = false;
    try{ await navigator.clipboard.writeText(link); ok = true; }catch(e){}
    if(!ok){ inp.focus(); inp.setSelectionRange(0, link.length); try{ ok = document.execCommand("copy"); }catch(e){} }
    toast(ok ? `Link copied. Now open ${browser} and paste it.` : "Press and hold the link above, then Copy.");
  };
  sh.el.querySelector("#insOk").onclick = closeSheet;
}
/* ============================================================
   VISITS — so the organisers can see who's been using the site.
   One record per visit (a visit ends after 30 minutes away):
   who, which device, when it started, how long the page was
   actually on screen, which pages and which country (see the
   country check below). Shown on traffic.html, behind the
   organiser PIN. No contents — just that they were here.
   ============================================================ */
const VISIT_GAP = 30 * 60000;
let _visit = null, _ticks = 0;
function deviceId(){ let d = localStorage.getItem("xmas_dev"); if(!d){ d = "d" + uid(); try{ localStorage.setItem("xmas_dev", d); }catch(e){} } return d; }
function deviceKind(){ const u = navigator.userAgent;
  return /iPhone|iPod/.test(u) ? "iPhone" : /iPad/.test(u) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "iPad" : /Android/.test(u) ? "Android" : "Computer"; }
const saveVisitLocal = () => { try{ sessionStorage.setItem("xmas_visit", JSON.stringify(_visit)); }catch(e){} };
function sendVisit(){
  if(!_visit) return; _visit.last = Date.now(); saveVisitLocal();
  const { sid, ...v } = _visit;
  col("visits").set(sid, v).catch(() => {});
}
/* ============================================================
   COUNTRY CHECK — the site is for family in Australia and New
   Zealand. Each device's country is looked up from its internet
   address (country only, kept on the phone for 6 hours) and saved
   on its visits. Anyone outside AU/NZ gets a "not available" screen.
   An organiser can let a device in with the PIN (family overseas or
   on a VPN). If the lookup fails we let them in rather than lock
   family out.
   ============================================================ */
const GEO_OK = ["AU", "NZ"], GEO_KEY = "xmas_geo", GEO_PASS = "xmas_geo_ok";
let _geo = null;
async function lookupCountry(){
  try{ const g = JSON.parse(localStorage.getItem(GEO_KEY) || "null"); if(g && g.cc && Date.now() - g.at < 6 * 3600000) return g.cc; }catch(e){}
  const tries = [
    async () => (await (await fetch("https://api.country.is/", { cache:"no-store" })).json()).country,
    async () => (await (await fetch("https://ipapi.co/country/", { cache:"no-store" })).text())
  ];
  for(const t of tries){
    try{ const cc = String(await withTimeout(t(), 6000) || "").trim().toUpperCase();
      if(/^[A-Z]{2}$/.test(cc)){ try{ localStorage.setItem(GEO_KEY, JSON.stringify({ cc, at:Date.now() })); }catch(e){} return cc; } }catch(e){}
  }
  return "";
}
const geoAllowed = cc => !cc || GEO_OK.includes(cc) || localStorage.getItem(GEO_PASS) === "1";
function blockScreen(cc){
  if(document.getElementById("geoBlock")) return;
  const d = document.createElement("div"); d.id = "geoBlock";
  d.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#12303B;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;font-family:Outfit,system-ui,sans-serif";
  d.innerHTML = `<div style="font-size:54px">🎄</div><h1 style="font-family:Fraunces,serif;margin:10px 0 8px">Not available here</h1>
    <p style="max-width:320px;opacity:.85;line-height:1.45">This is a private family site, only open in Australia and New Zealand.</p>
    <p style="max-width:320px;opacity:.6;font-size:13px">Family and overseas or on a VPN? Ask an organiser to let this phone in.</p>
    <button id="geoPin" style="margin-top:14px;border:0;border-radius:999px;padding:10px 18px;background:#F2B33D;color:#12303B;font-weight:700">Organiser PIN</button>`;
  document.body.appendChild(d); document.documentElement.style.overflow = "hidden";
  d.querySelector("#geoPin").onclick = async () => {
    d.style.zIndex = "10"; const ok = await askPin("Let this device in from outside Australia / NZ (" + cc + ")."); d.style.zIndex = "2147483000";
    if(ok){ localStorage.setItem(GEO_PASS, "1"); if(_visit){ _visit.blocked = false; _visit.let = true; sendVisit(); } d.remove(); document.documentElement.style.overflow = ""; }
  };
}
function checkCountry(){
  (_geo = _geo || lookupCountry()).then(cc => {
    if(_visit && cc && _visit.cc !== cc){ _visit.cc = cc; }
    const ok = geoAllowed(cc);
    if(_visit){ _visit.blocked = !ok; if(ok && cc && !GEO_OK.includes(cc)) _visit.let = true; if(cc) sendVisit(); }
    if(!ok) blockScreen(cc);
  });
}

/** Count this page view. boot() calls it; the front page calls it too (with nobody signed in yet). */
export function track(page){
  const who = me ? me.id : "";
  let v = null; try{ v = JSON.parse(sessionStorage.getItem("xmas_visit") || "null"); }catch(e){}
  if(!v || Date.now() - v.last > VISIT_GAP || (v.who && who && v.who !== who))
    v = { sid: "v" + uid(), who, dev: deviceId(), kind: deviceKind(), app: matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
          start: Date.now(), last: Date.now(), secs: 0, views: 0, pages: {} };
  if(who) v.who = who;                                  // picked a name part-way through the visit
  v.views++; const p = (page || "").replace(".html", "") || "front"; v.pages[p] = (v.pages[p] || 0) + 1;
  _visit = v; sendVisit(); checkCountry();
  if(track.on) return; track.on = true;
  setInterval(() => { if(document.hidden || !_visit) return; _visit.secs += 15; saveVisitLocal(); if(++_ticks % 4 === 0) sendVisit(); }, 15000);
  addEventListener("pagehide", sendVisit);
  document.addEventListener("visibilitychange", () => { if(document.hidden) sendVisit(); });
}

/* ============================================================
   WHERE'S WALLY — two ways to say where you are, both opt-in:
   1. "Share my location": while you have the site open, your spot
      goes on the family map (updated at most once a minute, or when
      you've moved 75 m). Phones only allow this after a yes on their
      own permission box, and only while the site is open.
   2. Check in: one tap records "Trudi · Bowling Club · 7:40pm".
   Both show on where.html.
   ============================================================ */
const R = 6371000, rad = x => x * Math.PI / 180;
/** metres between two points */
export const metres = (a, b) => { const dLa = rad(b.lat - a.lat), dLo = rad(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
export const howFar = m => m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
export const sharingOn = () => !!me && localStorage.getItem("xmas_share_" + me.id) === "1";
let _watch = null, _sent = null;
export function startSharing(){
  if(!me || !navigator.geolocation || _watch !== null) return;
  _watch = navigator.geolocation.watchPosition(p => {
    const here = { lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) };
    if(_sent && Date.now() - _sent.at < 60000 && metres(_sent, here) < 75) return;
    _sent = { ...here, at: Date.now() };
    col("whereabouts").set(me.id, { ...here, acc: Math.round(p.coords.accuracy || 0), at: Date.now(), sharing: true }).catch(() => {});
    dispatchEvent(new CustomEvent("xmas-here", { detail: here }));
  }, err => {
    if(err.code === 1){ stopSharing(); try{ localStorage.setItem("xmas_share_" + me.id, "0"); }catch(e){}
      dispatchEvent(new Event("xmas-share")); toast("Your phone said no to location for this site, so sharing is off. You can allow it in your phone's settings.", 5000); }
  }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 30000 });
}
export function stopSharing(){ if(_watch !== null){ navigator.geolocation.clearWatch(_watch); _watch = null; } _sent = null; }
document.addEventListener("visibilitychange", () => { if(!document.hidden && sharingOn() && _watch === null) startSharing(); });
/** Turn sharing on or off for the signed-in person. Off also takes their dot off the map. */
export async function setSharing(on){
  if(!me) return;
  try{ localStorage.setItem("xmas_share_" + me.id, on ? "1" : "0"); }catch(e){}
  if(on){ startSharing(); }
  else { stopSharing(); await col("whereabouts").set(me.id, { sharing: false, lat: null, lng: null, at: Date.now() }); }
  dispatchEvent(new Event("xmas-share"));
}
/** One-off position, or null if the phone says no / can't tell. */
export const hereNow = () => new Promise(res => {
  if(!navigator.geolocation) return res(null);
  navigator.geolocation.getCurrentPosition(p => res({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5), acc: p.coords.accuracy }),
    () => res(null), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
});
/** The check-in sheet: nearest known places first (if the phone gives a location), or type your own. */
export async function checkIn(places){
  const sh = openSheet(`<h3>Check in</h3><p class="muted small" id="ciMsg">Finding where you are…</p><div id="ciList"></div>`);
  const here = await hereNow();
  if(!document.body.contains(sh.el)) return;
  const near = places.filter(p => p.lat).map(p => ({ ...p, d: here ? metres(here, p) : null }))
    .sort((a, b) => here ? a.d - b.d : a.name.localeCompare(b.name));
  sh.el.querySelector("#ciMsg").textContent = here ? (near[0] && near[0].d < 400 ? "Looks like you're at one of these:" : "Nearest places to you:") : "Couldn't get your location — pick where you are:";
  const show = here ? near.slice(0, 6) : near;
  sh.el.querySelector("#ciList").innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">${show.map((p, i) =>
      `<button class="btn ${i === 0 && here && p.d < 400 ? "red" : "ghost"}" data-ci="${i}" style="justify-content:space-between;text-align:left">${esc(p.name)}${p.d != null ? `<span class="small" style="opacity:.8">${howFar(p.d)}</span>` : ""}</button>`).join("")}</div>
    <label class="f" for="ciOwn">Somewhere else?</label>
    <div class="row"><input class="in" id="ciOwn" maxlength="40" placeholder="e.g. Nan's caravan, the rock pool"><button class="btn" id="ciOwnGo" style="flex:none">Check in</button></div>
    ${here ? "" : `<p class="small muted" style="margin-top:8px">Typed places only go on the map if your phone shares its location.</p>`}
    <div class="acts"><button class="btn ghost" id="ciNo">Cancel</button></div>`;
  const save = async (place, at) => {
    closeSheet(); celebrate("checkin");
    try{ await col("checkins").add({ who: me.id, place, lat: at ? at.lat : null, lng: at ? at.lng : null, at: Date.now(), gps: !!here }); toast(`Checked in at ${place}`); }
    catch(e){ toast("Couldn't check in — " + e.message); }
  };
  sh.el.querySelectorAll("[data-ci]").forEach(b => b.onclick = () => { const p = show[+b.dataset.ci];
    // at a known place: use your real spot if you're close by, otherwise the place's own spot
    save(p.name, here && p.d < 400 ? here : { lat: p.lat, lng: p.lng }); });
  sh.el.querySelector("#ciOwnGo").onclick = () => { const v = sh.el.querySelector("#ciOwn").value.trim(); if(!v){ toast("Type where you are"); return; } save(v, here); };
  sh.el.querySelector("#ciNo").onclick = closeSheet;
}

/* Straight after someone signs in (once per person, per phone): say plainly what's about to happen, then
   tap OK → the phone's own "Allow location?" box. Saying no here, or on the phone's box, is fine —
   they can switch it on later on the Where's Sally page. */
function locationNotice(page){
  if(!me || !navigator.geolocation || page === "traffic.html") return;
  const key = "xmas_locask_" + me.id;
  if(localStorage.getItem(key)) return;
  setTimeout(() => {
    if(document.getElementById("xmas-sheet") || document.getElementById("kfile") || sharingOn()) return;
    const sh = openSheet(`<div style="text-align:center;font-size:44px;line-height:1;margin:4px 0 6px">📍</div>
      <h3 style="text-align:center">Your location</h3>
      <p style="margin:0 0 10px">Hi ${esc(me.name)}! When you tap <b>OK</b>, your phone will ask if this website can use your location.</p>
      <p style="margin:0 0 10px">If you say <b>Allow</b>, the family can see where you are on the <b>Where's Sally?</b> map while you have this site open — handy for finding each other at the beach or the club.</p>
      <p class="banner" style="margin:0 0 4px">🔒 Only the family on this website can see it. It isn't shared with anyone else, and you can turn it off any time on the Where's Sally? page.</p>
      <div class="acts"><button class="btn red wide" id="locOk">OK</button></div>
      <p style="text-align:center;margin:10px 0 0"><button id="locNo" style="background:none;border:0;color:var(--ink-soft);text-decoration:underline;text-underline-offset:3px;font-size:14px">Don't share my location</button></p>`);
    const done = () => { try{ localStorage.setItem(key, String(Date.now())); }catch(e){} };
    sh.el.querySelector("#locOk").onclick = async () => { done(); closeSheet();
      try{ await setSharing(true); toast("Thanks! If your phone asks, tap Allow.", 4000); }catch(e){ toast("Couldn't turn it on — " + e.message); } };
    sh.el.querySelector("#locNo").onclick = () => { done(); closeSheet(); toast("No worries. You can switch it on later on the Where's Sally? page.", 4200); };
  }, 700);
}

/* ============================================================
   CAROLS — Christmas music played by the site itself, as a soft
   music box (no recordings, so nothing to download and nothing
   under copyright: these are all traditional carols, centuries old).
   A 🎵 button in the corner turns it on and off; the choice is
   remembered on the phone. Phones only let sound start after a tap,
   so on each new page the music picks up where it left off the
   moment you touch the screen.
   Notes are written NAME:BEATS ("F#4:1.5"), R for a rest.
   ============================================================ */
const CAROLS = [
  { t:"Jingle Bells", bpm:208, bells:true, n:`E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:.5 E5:4 F5:1 F5:1 F5:1.5 F5:.5 F5:1 E5:1 E5:1 E5:.5 E5:.5
    E5:1 D5:1 D5:1 E5:1 D5:2 G5:2 E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:.5 E5:4 F5:1 F5:1 F5:1 F5:1 F5:1 E5:1 E5:1 E5:.5 E5:.5 G5:1 G5:1 F5:1 D5:1 C5:4` },
  { t:"We Wish You a Merry Christmas", bpm:150, n:`D4:1 G4:1 G4:.5 A4:.5 G4:.5 F#4:.5 E4:1 E4:1 E4:1 A4:1 A4:.5 B4:.5 A4:.5 G4:.5 F#4:1 D4:1 D4:1
    B4:1 B4:.5 C5:.5 B4:.5 A4:.5 G4:1 E4:1 D4:.5 D4:.5 E4:1 A4:1 F#4:1 G4:3` },
  { t:"Deck the Halls", bpm:132, n:`C5:1.5 Bb4:.5 A4:1 G4:1 F4:1 G4:1 A4:1 F4:1 G4:.5 A4:.5 Bb4:.5 G4:.5 A4:1.5 G4:.5 F4:1 E4:1 F4:2
    C5:1.5 Bb4:.5 A4:1 G4:1 F4:1 G4:1 A4:1 F4:1 G4:.5 A4:.5 Bb4:.5 G4:.5 A4:1.5 G4:.5 F4:1 E4:1 F4:2
    G4:1.5 A4:.5 Bb4:1 G4:1 A4:1.5 Bb4:.5 C5:1 G4:1 A4:.5 B4:.5 C5:1 D5:.5 E5:.5 F5:1 E5:1 D5:1 C5:2
    C5:1.5 Bb4:.5 A4:1 G4:1 F4:1 G4:1 A4:1 F4:1 D5:.5 D5:.5 D5:.5 D5:.5 C5:1.5 Bb4:.5 A4:1 G4:1 F4:2` },
  { t:"Silent Night", bpm:150, n:`G4:1.5 A4:.5 G4:1 E4:3 G4:1.5 A4:.5 G4:1 E4:3 D5:2 D5:1 B4:3 C5:2 C5:1 G4:3
    A4:2 A4:1 C5:1.5 B4:.5 A4:1 G4:1.5 A4:.5 G4:1 E4:3 A4:2 A4:1 C5:1.5 B4:.5 A4:1 G4:1.5 A4:.5 G4:1 E4:3
    D5:2 D5:1 F5:1.5 D5:.5 B4:1 C5:3 E5:3 C5:1 G4:1 E4:1 G4:1.5 F4:.5 D4:1 C4:6` },
  { t:"Joy to the World", bpm:112, n:`C5:1 B4:.75 A4:.25 G4:1.5 F4:.5 E4:1 D4:1 C4:1.5 G4:.5 A4:1.5 A4:.5 B4:1.5 B4:.5 C5:3
    C5:.5 C5:.5 B4:.5 A4:.5 G4:.5 G4:.75 F4:.25 E4:.5 C5:.5 C5:.5 B4:.5 A4:.5 G4:.5 G4:.75 F4:.25 E4:.5
    E4:.5 E4:.5 E4:.5 E4:.5 E4:.25 F4:.25 G4:1.5 F4:.25 E4:.25 D4:.5 D4:.5 D4:.5 D4:.25 E4:.25 F4:1.5
    E4:.25 D4:.25 C4:.5 C5:1 A4:.5 G4:.75 F4:.25 E4:.5 F4:.5 E4:1 D4:1 C4:2` },
  { t:"Good King Wenceslas", bpm:140, n:`G4:1 G4:1 G4:1 A4:1 G4:1 G4:1 D4:2 E4:1 D4:1 E4:1 F#4:1 G4:2 G4:2
    G4:1 G4:1 G4:1 A4:1 G4:1 G4:1 D4:2 E4:1 D4:1 E4:1 F#4:1 G4:2 G4:2
    D5:1 C5:1 B4:1 A4:1 B4:1 A4:1 G4:2 E4:1 D4:1 E4:1 F#4:1 G4:2 G4:2
    D4:1 D4:1 E4:1 F#4:1 G4:1 G4:1 A4:2 D5:1 C5:1 B4:1 A4:1 G4:2 C5:2 G4:4` }
];
const SEMI = { C:-9, D:-7, E:-5, F:-4, G:-2, A:0, B:2 };
const freq = name => { const m = /^([A-G])([#b]?)(\d)$/.exec(name); if(!m) return 0;
  return 440 * Math.pow(2, (SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (+m[3] - 4) * 12) / 12); };
// each carol plays twice through, with a breath in between
const TUNES = CAROLS.map(c => { const once = c.n.trim().split(/\s+/).map(x => { const [n, b] = x.split(":"); return [n === "R" ? 0 : freq(n), +b]; });
  return [...once, [0, 2], ...once]; });
let mx = null, mGain = null, mTimer = null, mSong = 0, mIdx = 0, mNext = 0, mPlaying = false;
/* background music is always on, unless the person has switched Sound off on the home page */
export const musicOn = () => localStorage.getItem("xmas_muted") !== "1";
function mCtx(){
  if(!mx){ try{ mx = new (window.AudioContext || window.webkitAudioContext)(); mGain = mx.createGain(); mGain.gain.value = 0.2; mGain.connect(mx.destination); }catch(e){ return null; } }
  return mx;
}
function bell(f, t, dur){
  const end = t + Math.min(2.2, dur + 1.1);
  [[f, .5, "sine", end], [f * 2, .16, "sine", t + Math.min(1, dur + .4)], [f * 4, .035, "triangle", t + .25]].forEach(([fr, v, type, stop]) => {
    const o = mx.createOscillator(), g = mx.createGain(); o.type = type; o.frequency.setValueAtTime(fr, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, stop);
    o.connect(g); g.connect(mGain); o.start(t); o.stop(stop + 0.05);
  });
}
function jingle1(t){   // a little sleigh-bell shake on the beat, for Jingle Bells
  for(let i = 0; i < 3; i++){ const o = mx.createOscillator(), g = mx.createGain(), s = t + i * 0.025;
    o.type = "square"; o.frequency.setValueAtTime(5200 + Math.random() * 1800, s);
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.025, s + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.06);
    o.connect(g); g.connect(mGain); o.start(s); o.stop(s + 0.08); }
}
function mTick(){
  if(!mPlaying || !mx) return;
  while(mNext < mx.currentTime + 0.4){
    const song = CAROLS[mSong], tune = TUNES[mSong], spb = 60 / song.bpm;
    if(mIdx >= tune.length){ mSong = (mSong + 1) % CAROLS.length; mIdx = 0; mNext += 2.2; paintMusic(); continue; }
    const [f, beats] = tune[mIdx];
    if(f) bell(f, mNext, beats * spb);
    if(song.bells && Number.isInteger(tune.slice(0, mIdx).reduce((a, x) => a + x[1], 0))) jingle1(mNext);
    mNext += beats * spb; mIdx++;
  }
  try{ sessionStorage.setItem("xmas_music_at", JSON.stringify({ s: mSong, i: mIdx })); }catch(e){}
}
function startMusic(){
  const c = mCtx(); if(!c || mPlaying) return;
  if(c.state === "suspended") c.resume();
  try{ const at = JSON.parse(sessionStorage.getItem("xmas_music_at") || "null"); if(at){ mSong = at.s % CAROLS.length; mIdx = at.i || 0; } }catch(e){}
  mPlaying = true; mNext = c.currentTime + 0.15;
  mTimer = setInterval(mTick, 120); mTick(); paintMusic();
}
function stopMusic(){ mPlaying = false; clearInterval(mTimer); mTimer = null; if(mGain && mx){ const t = mx.currentTime; mGain.gain.cancelScheduledValues(t); mGain.gain.setValueAtTime(mGain.gain.value, t);
  mGain.gain.linearRampToValueAtTime(0.0001, t + 0.3); setTimeout(() => { if(!mPlaying && mGain) mGain.gain.value = 0.2; if(!mPlaying && mx) mx.suspend(); }, 400); } paintMusic(); }
function nextCarol(){ mSong = (mSong + 1) % CAROLS.length; mIdx = 0; try{ sessionStorage.setItem("xmas_music_at", JSON.stringify({ s: mSong, i: 0 })); }catch(e){}
  if(mPlaying && mx){ const t = mx.currentTime; mGain.gain.setValueAtTime(0.0001, t); mGain.gain.linearRampToValueAtTime(0.2, t + 0.4); mNext = t + 0.3; } paintMusic(); }
function paintMusic(){
  const b = document.getElementById("carolBtn"); if(!b) return;
  const on = musicOn();
  b.classList.toggle("on", on && mPlaying); b.classList.toggle("wait", on && !mPlaying);
  b.querySelector(".lbl").textContent = !on ? "Carols" : mPlaying ? CAROLS[mSong].t : "Tap to play";
  b.setAttribute("aria-label", on ? "Turn the carols off" : "Play Christmas carols");
  document.getElementById("carolNext")?.classList.toggle("hide", !(on && mPlaying));
}
/** Background carols on every page. No button: they start by themselves — phones only allow sound after
 *  a touch, so in practice at the first tap on each page — and carry on from where the last page left off.
 *  The Sound on/off switch on the home page stops and starts them. */
export function musicButton(){
  if(musicButton.done) return; musicButton.done = true;
  const evs = ["pointerup", "touchend", "click", "keydown"];
  /* Phones only let sound start from a real tap (on Android a finger going DOWN doesn't count — only lifting it),
     so keep trying on every tap until the audio is actually running, then stop listening. */
  const kick = () => {
    if(!musicOn()) return;
    const c = mCtx(); if(!c) return;
    if(c.state !== "running"){
      try{ c.resume(); }catch(e){}
      try{ const src = c.createBufferSource(); src.buffer = c.createBuffer(1, 1, 22050); src.connect(c.destination); src.start(0); }catch(e){}  // older iPhones need this to unlock
    }
    if(!mPlaying) startMusic();
    if(c.state === "running") evs.forEach(ev => removeEventListener(ev, kick, true));
  };
  evs.forEach(ev => addEventListener(ev, kick, true));
  if(musicOn()){ const c = mCtx(); if(c && c.state === "running") kick(); }
  addEventListener("xmas-mute", () => { if(musicOn()){ evs.forEach(ev => addEventListener(ev, kick, true)); kick(); } else if(mPlaying) stopMusic(); });
  document.addEventListener("visibilitychange", () => { if(!mx) return; if(document.hidden) mx.suspend(); else if(mPlaying) mx.resume(); });
}

/** Every page calls this first. Sends you to the front page if we don't know who you are. */
export function boot(page){
  if(!me){ location.replace("index.html"); return false; }
  const quiet = noPokies();
  if(quiet && page === "casino.html"){ location.replace("home.html"); return false; }
  {   // one rule hides anything pokie-shaped the moment someone opts out
    const st = document.createElement("style");
    st.textContent = "body.nopokies .show-casino, body.nopokies [data-casino]{display:none !important}";
    document.head.appendChild(st);
    document.body.classList.toggle("nopokies", quiet);
  }
  const nav = document.createElement("nav"); nav.className = "nav";
  nav.innerHTML = NAV.map(([href, g, l]) =>
    `<a href="${href}"${href === page ? ' aria-current="page"' : ""}><b>${g}${href === "chat.html" ? '<i class="chatn hide"></i>' : ""}</b>${l}</a>`).join("");
  document.body.appendChild(nav);
  watchChat();                             // 💬 unread count on the nav, and a pop-up when someone messages you
  startShowcase(page);                     // today's app: strips, floating button and the last nav slot
  if(!quiet){ linkCasino(); setTimeout(() => raffleWin(page), 1200); } else _casinoReady = true;
  promptWatch(page);
  if(page !== "traffic.html") track(page);
  if(page !== "music.html") musicButton();   // no carols over the Spotify player
  if(sharingOn()) startSharing();          // "Share my location" carries on across every page while the site's open
  else locationNotice(page);               // first time signed in on this phone: explain, then ask
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  return true;
}

/* ============================================================
   THE SHOWCASE — one app gets the big treatment each day: a strip
   near the top and the bottom of every page, the floating button on
   the right and the last slot of the nav. It used to always be the
   pokies. Now it changes by itself every day — the same app for
   everyone, going by the date at camp (Sydney) — and an organiser can
   pick one from the home page, for today or until they change it.
   Saved in settings "showcase": { app, mode:"today"|"keep", day, off:[ids left out of the daily mix] }.
   ============================================================ */
const SYMS = ["🎄","🎅","🦐","🍒","7️⃣","🔔","⭐","🎁"];
const reelStrip = (syms = SYMS) => { const a = [...syms].sort(() => Math.random() - .5); return [...a, ...a].map(x => `<b>${x}</b>`).join(""); };

/* colours for the strip, the floating button and the nav word */
const SHOW_THEMES = {
  casino:  { bg:"linear-gradient(100deg,#0E3B2A,#14583C 55%,#7A1E1A)", ring:"#E2A93B", hi:"#FFD166", ink:"#FFE9B0", go:"#E2A93B", goink:"#12303B", gosh:"#9C6C14", fl:"linear-gradient(180deg,#D8352A,#8E1F18)", nav:"#D8352A" },
  pink:    { bg:"linear-gradient(100deg,#6E2450,#B0447A 55%,#E0789C)", ring:"#FFC2DA", hi:"#FFE0EE", ink:"#FFF0F6", go:"#FFC2DA", goink:"#5A1F40", gosh:"#B9708F", fl:"linear-gradient(180deg,#D9558F,#8E2A5A)", nav:"#C23B78" },
  sea:     { bg:"linear-gradient(100deg,#0F3B57,#1C6E8C 55%,#2A9D8F)", ring:"#7FD6E8", hi:"#BDEFF7", ink:"#E6FAFF", go:"#7FD6E8", goink:"#0F3B57", gosh:"#3E8FA3", fl:"linear-gradient(180deg,#2A9DB8,#14587A)", nav:"#1C7A99" },
  festive: { bg:"linear-gradient(100deg,#7A1E1A,#B3261E 55%,#14583C)", ring:"#F4D58D", hi:"#FFE9A8", ink:"#FFF4DA", go:"#F4D58D", goink:"#5A1712", gosh:"#B08A3A", fl:"linear-gradient(180deg,#14803F,#0E4A2A)", nav:"#B3261E" },
  gold:    { bg:"linear-gradient(100deg,#4A3510,#8A6418 55%,#C99A2E)", ring:"#FFE08A", hi:"#FFEDB3", ink:"#FFF7DE", go:"#FFE08A", goink:"#4A3510", gosh:"#B38F2E", fl:"linear-gradient(180deg,#D9A62E,#8A6418)", nav:"#A87A14" },
  tunes:   { bg:"linear-gradient(100deg,#0F2E1C,#146C3A 55%,#1DB954)", ring:"#B8F5CF", hi:"#D6FAE3", ink:"#F0FFF5", go:"#B8F5CF", goink:"#0F2E1C", gosh:"#5FAF7E", fl:"linear-gradient(180deg,#1DB954,#0F6B32)", nav:"#178A43" },
  siren:   { bg:"linear-gradient(100deg,#2B1A4A,#5A1E6E 55%,#B3261E)", ring:"#FF9C8F", hi:"#FFC9C1", ink:"#FFF0EE", go:"#FF9C8F", goink:"#3A1020", gosh:"#B5584C", fl:"linear-gradient(180deg,#3D5AFE,#B3261E)", nav:"#B3261E" }
};

/** Every app that can be showcased, in the order the daily mix goes through them.
 *  (Home, Chat, Plan, Food, Games and Photos already have their own nav buttons, so they're not on the list.) */
export const SHOWCASE = [
  { id:"pokies", page:"casino.html", icon:"🎰", nav:"Pokies", lbl:"POKIES", name:"The casino", tag:"Pokies, cards and a bit of fun.", go:"Spin →", theme:"casino", syms:SYMS,
    leads:["🎰 Pokie break", "🎰 Feeling lucky?", "🎰 One more spin", "🎰 Santa's little flutter", "🎰 While the prawns thaw"] },
  { id:"babies", page:"babies.html", icon:"👶", nav:"Baby?", lbl:"BABY?", name:"Guess the Baby", tag:"Kay's comp — who grew up to be this lot?", go:"Guess →", theme:"pink",
    syms:["👶","🍼","🧸","🎀","🐣","🧷","🎈","🍭"], leads:["👶 Who's that baby?", "👶 Kay's comp", "🍼 Spot the family", "🧸 Get your guess in"] },
  { id:"sally", page:"where.html", icon:"🔎", nav:"Sally?", lbl:"SALLY?", name:"Where's Sally?", tag:"Who's where, and where everyone's checked in.", go:"Find her →", theme:"sea", pic:"sally.jpg",
    syms:["🔎","📍","🗺️","👀","🏖️","🚗","⛺","❓"], leads:["🔎 Where's Sally?", "📍 Who's where", "👀 Spot the family", "🗺️ Check in"] },
  { id:"santa", page:"santa.html", icon:"🎁", nav:"Santa", lbl:"SANTA", name:"Secret Santa", tag:"Steal & grab style — who'll end up with what?", go:"Open →", theme:"festive",
    syms:["🎁","🎅","🎄","🦌","⭐","🔔","🍪","❄️"], leads:["🎁 Secret Santa", "🎅 Steal or keep?", "🎄 Santa's sack", "🎁 What's in the box?"] },
  { id:"fishing", page:"fishing.html", icon:"🎣", nav:"Fishing", lbl:"FISH", name:"Fishing comp", tag:"Biggest catch of the week — get your photo in.", go:"Cast →", theme:"sea",
    syms:["🎣","🐟","🐠","🦈","🦀","🌊","🪝","🐙"], leads:["🎣 Fishing comp", "🐟 Biggest catch?", "🌊 Gone fishing", "🦀 What's biting?"] },
  { id:"tunes", page:"music.html", icon:"🎵", nav:"Tunes", lbl:"TUNES", name:"Camp tunes", tag:"One big playlist — add your songs for the week.", go:"Play →", theme:"tunes",
    syms:["🎵","🎶","🎸","🎤","🥁","🎹","🎧","📻"], leads:["🎵 Camp tunes", "🎶 Add a song", "🎧 What's playing?", "🎤 Request one"] },
  { id:"trauma", page:"trauma.html", icon:"🚨", nav:"Trauma", lbl:"REPORT", name:"Report-a-trauma", tag:"Strictly confidential — sealed until the big reveal.", go:"Report →", theme:"siren",
    syms:["🚨","🤐","📝","🙈","😱","🔒","👀","📣"], leads:["🚨 Report-a-trauma", "🤐 Get it off your chest", "📝 Strictly confidential", "🙈 Who did what?"] },
  { id:"awards", page:"awards.html", icon:"🏅", nav:"Awards", lbl:"AWARDS", name:"Daily awards", tag:"Nominations are open — who deserved it today?", go:"Vote →", theme:"gold",
    syms:["🏅","🏆","🥇","🎖️","👏","⭐","🎉","👑"], leads:["🏅 Daily awards", "🏆 Who deserved it?", "👑 Nominate someone", "🎉 Today's winners"] },
  { id:"outfits", page:"outfits.html", icon:"👗", nav:"Outfits", lbl:"OUTFIT", name:"Best Outfit", tag:"Snap your look — most up votes wins.", go:"Vote →", theme:"pink",
    syms:["👗","🕺","👔","🎩","👠","🧣","📸","👑"], leads:["👗 Best Outfit", "📸 Strike a pose", "👑 Who's best dressed?", "🕺 Get your look in"] },
  { id:"stars", page:"stars.html", icon:"⭐", nav:"Stars", lbl:"STARS", name:"Gold stars", tag:"Who's winning? Hand out a gold star.", go:"See →", theme:"gold",
    syms:["⭐","🌟","✨","🏆","👏","💫","🥇","🎉"], leads:["⭐ Gold stars", "🌟 Who's winning?", "✨ Give a star", "🏆 The ladder"] },
  { id:"comps", page:"games.html", icon:"🏆", nav:"Comps", lbl:"COMPS", name:"Tournaments", tag:"Bragging rights — draws, scores and who's through.", go:"Play →", theme:"festive",
    syms:["🏆","🏓","🎯","🃏","🏏","🎲","⚽","🥇"], leads:["🏆 Tournaments", "🎯 Bragging rights", "🏓 Who's up next?", "🎲 Game on"] },
  { id:"outings", page:"places.html", icon:"🏖️", nav:"Outings", lbl:"OUT", name:"Things to do", tag:"Around Bateau Bay — beaches, walks and day trips.", go:"Go →", theme:"sea",
    syms:["🏖️","🌊","🥾","🍦","🐨","☀️","🚤","🏄"], leads:["🏖️ Things to do", "🌊 Day out?", "🍦 Around the bay", "🥾 Go for a walk"] }
];
export const showcaseApp = id => SHOWCASE.find(a => a.id === id) || null;

/* the date at camp, so everyone (Sydney or back in NZ) gets the same app on the same day */
export function campDay(at = new Date()){
  try{ return new Intl.DateTimeFormat("en-CA", { timeZone:"Australia/Sydney", year:"numeric", month:"2-digit", day:"2-digit" }).format(at); }
  catch(e){ return isoDate(at); }
}
let _show = (() => { try{ return JSON.parse(localStorage.getItem("xmas_showcase") || "null") || {}; }catch(e){ return {}; } })();
/** The saved showcase settings: { app, mode, day, off } */
/* the casino has the floating button every day, so by default it sits out of the daily mix for the strips */
export const showcaseSettings = () => ({ app:"", mode:"", day:"", ..._show, off: Array.isArray(_show.off) ? _show.off : ["pokies"] });
export const saveShowcase = v => settings("showcase").save(v);

/** Can this person be shown this app? (no pokies for those who've asked; no trauma pop-ins for those who've turned it off) */
const canSee = a => a.id === "pokies" ? !noPokies() : a.id === "trauma" ? !traumaOff() : true;

/** The app showcased on a day ("YYYY-MM-DD", default today at camp). everyone=true ignores this person's own opt-outs.
 *  Returns { ...app, why:"organiser"|"mix" } */
export function showcaseOn(day = campDay(), everyone = false){
  const ok = a => everyone || canSee(a), s = showcaseSettings();
  const pinned = s.app && (s.mode === "keep" || s.day === day) ? showcaseApp(s.app) : null;
  if(pinned && ok(pinned)) return { ...pinned, why:"organiser" };
  let pool = SHOWCASE.filter(a => !(s.off || []).includes(a.id)); if(!pool.length) pool = SHOWCASE;
  const [y, m, d] = day.split("-").map(Number), n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 864e5);
  for(let k = 0; k < pool.length; k++){ const a = pool[(((n + k) % pool.length) + pool.length) % pool.length]; if(ok(a)) return { ...a, why:"mix" }; }
  const any = SHOWCASE.find(ok); return any ? { ...any, why:"mix" } : null;
}

function showCSS(){
  if(document.getElementById("xmas-pokie-css")) return;
  const st = document.createElement("style"); st.id = "xmas-pokie-css";
  st.textContent = `
.pokiebar{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--sb-ink,#FFE9B0);position:relative;overflow:hidden;
 background:var(--sb-bg,linear-gradient(100deg,#0E3B2A,#14583C 55%,#7A1E1A));border-radius:16px;padding:12px 14px;margin:0 0 16px;
 box-shadow:0 0 0 2px var(--sb-ring,#E2A93B), 0 10px 26px -12px rgba(60,10,60,.7)}
.pokiebar::before{content:'';position:absolute;inset:3px;border-radius:13px;pointer-events:none;
 background:radial-gradient(circle,var(--sb-hi,#FFD166) 1.6px,transparent 2.2px) 0 0/14px 14px;opacity:.55;
 -webkit-mask:linear-gradient(#000 0 0) top/100% 4px no-repeat,linear-gradient(#000 0 0) bottom/100% 4px no-repeat;
         mask:linear-gradient(#000 0 0) top/100% 4px no-repeat,linear-gradient(#000 0 0) bottom/100% 4px no-repeat;
 animation:xmas-bulbs 1s steps(2) infinite}
@keyframes xmas-bulbs{50%{background-position:7px 0;opacity:.95}}
.pokiebar .reels{display:flex;gap:3px;flex:none;background:#0E0818;border-radius:9px;padding:5px;box-shadow:inset 0 2px 6px rgba(0,0,0,.6)}
.pokiebar .reel{width:26px;height:30px;overflow:hidden;background:#FFF8E6;border-radius:5px;position:relative}
.pokiebar .reel span{display:flex;flex-direction:column;font-size:19px;line-height:30px;text-align:center;animation:xmas-spin var(--d,1.4s) cubic-bezier(.5,0,.5,1) infinite}
@keyframes xmas-spin{0%{transform:translateY(0)}100%{transform:translateY(-240px)}}
.pokiebar .tx{flex:1;min-width:0}
.pokiebar .tx small{display:block;font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--sb-hi,#FFD166);opacity:.85}
.pokiebar .tx b{display:block;font-family:'Fraunces',serif;font-weight:900;font-size:17px;line-height:1.15;color:#fff;margin-top:2px}
.pokiebar .tx em{display:block;font-style:normal;font-size:12.5px;opacity:.8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pokiebar .go{flex:none;background:var(--sb-go,#E2A93B);color:var(--sb-goink,#12303B);font-weight:700;border-radius:999px;padding:8px 13px;font-size:13px;box-shadow:0 3px 0 var(--sb-gosh,#9C6C14)}
.pokiefloat{position:fixed;right:17px;bottom:calc(158px + env(safe-area-inset-bottom));z-index:44;width:54px;height:60px;border:0;padding:0;
 border-radius:14px 14px 10px 10px;background:var(--sb-fl,linear-gradient(180deg,#D8352A,#8E1F18));box-shadow:0 0 0 2px var(--sb-ring,#E2A93B),0 10px 22px -8px rgba(80,20,10,.75);
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;animation:xmas-wobble 6s ease-in-out infinite}
.pokiefloat.lever::after{content:'';position:absolute;left:-7px;top:12px;width:5px;height:24px;border-radius:3px;background:#3E5A63;box-shadow:0 -6px 0 3px #E2A93B}
.pokiefloat .win{display:flex;gap:2px;background:#0E0818;border-radius:6px;padding:3px}
.pokiefloat .win i{width:13px;height:18px;overflow:hidden;background:#FFF8E6;border-radius:3px;font-style:normal}
.pokiefloat .win i span{display:flex;flex-direction:column;font-size:11px;line-height:18px;text-align:center;animation:xmas-spin2 var(--d,1s) linear infinite}
.pokiefloat .pic{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #fff;display:block}
@keyframes xmas-spin2{100%{transform:translateY(-144px)}}
.pokiefloat .lbl{font-family:'DM Mono',monospace;font-size:8.5px;letter-spacing:.14em;color:var(--sb-ink,#FFE9B0);font-weight:500}
@keyframes xmas-wobble{0%,90%,100%{transform:rotate(0)}92%{transform:rotate(-6deg)}94%{transform:rotate(5deg)}96%{transform:rotate(-3deg)}}
.nav .pokienav{color:var(--sb-nav,#D8352A);font-weight:600}
.nav .pokienav b{animation:xmas-wobble 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.pokiebar .reel span,.pokiefloat .win i span,.pokiefloat,.nav .pokienav b,.pokiebar::before{animation:none !important}}`;
  document.head.appendChild(st);
}
const themeVars = a => Object.entries(SHOW_THEMES[a.theme] || SHOW_THEMES.casino).map(([k, v]) => `--sb-${k}:${v}`).join(";");
const reels = (a, open, close, d0, dd) => [0,1,2].map(i => `${open}<span style="--d:${d0 + i*dd}s">${reelStrip(a.syms)}</span>${close}`).join("");

/** One strip. For the pokies it names a game and opens THAT game; for any other app it opens the app's page. */
function showBar(a, lead, game){
  const el = document.createElement("a");
  el.className = "pokiebar showbit" + (a.id === "pokies" ? " show-casino" : ""); el.style.cssText = themeVars(a);
  let name = a.name, tag = a.tag, go = a.go;
  if(a.id === "pokies"){
    const g = game || randomGame(true);
    el.href = gameUrl(g); el.dataset.file = g.file; name = g.name; tag = g.tag;
    el.addEventListener("click", () => { el.href = gameUrl(g); }, true);
  } else el.href = a.page;
  el.innerHTML = `<span class="reels">${reels(a, '<span class="reel">', '</span>', 1.1, .35)}</span>
    <span class="tx"><small>${esc(lead)}</small><b>${esc(name)}</b><em>${esc(tag)}</em></span><span class="go">${esc(go)}</span>`;
  return el;
}

let _showPage = null, _shown = null, _dzSeen = new Set(), _dzIO = null;
/* the floating button steps aside while a big upload box (or one of the strips) is on screen */
function watchDropzones(){
  if(!("IntersectionObserver" in window)) return;
  _dzSeen.forEach(el => { if(!el.isConnected) _dzSeen.delete(el); });
  if(!_dzIO) _dzIO = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? _dzSeen.add(e.target) : _dzSeen.delete(e.target));
    document.body.classList.toggle("dz-in-view", _dzSeen.size > 0); });
  document.querySelectorAll(".dropzone, .pokiebar").forEach(z => { if(!z._dzWatched){ z._dzWatched = true; _dzIO.observe(z); } });
  document.body.classList.toggle("dz-in-view", _dzSeen.size > 0);
}

/** Put today's showcase on the page (or swap it if the pick has changed). */
function paintShowcase(force = false){
  const page = _showPage; if(!page) return;
  const a = showcaseOn();
  const key = (a ? a.id : "") + "/" + (noPokies() ? "quiet" : "casino");   // the strips' app, and whether the floating casino is shown
  if(!force && _shown === key) return;
  _shown = key;
  document.querySelectorAll(".showbit").forEach(el => el.remove());
  const nav = document.querySelector("nav.nav");
  if(!a){ watchDropzones(); return; }
  showCSS();
  const own = page === a.page;
  // the nav slot
  if(nav){
    const n = document.createElement("a");
    n.className = "pokienav showbit" + (a.id === "pokies" ? " show-casino" : ""); n.href = a.page; n.style.cssText = themeVars(a);
    if(a.id === "pokies") n.dataset.game = "";
    if(own) n.setAttribute("aria-current", "page");
    n.innerHTML = `<b>${a.icon}</b>${esc(a.nav)}`;
    nav.appendChild(n);
  }
  const main = document.querySelector("main");
  if(main && !own){
    const pick = () => a.leads[Math.floor(Math.random() * a.leads.length)];
    // the headline strip up top (for the pokies: the family machine); a second one at the bottom
    const top = a.id === "pokies" ? showBar(a, "🎰 The family machine", LUCKY_LAUREN) : showBar(a, `${a.icon} Today's pick`), first = main.firstElementChild;
    // things marked keep-top (Kay's upload box) stay above the strip
    let after = null; for(const el of main.children){ if(el.classList.contains("keep-top")) after = el; else break; }
    if(after) after.after(top);
    else if(first && parseFloat(getComputedStyle(first).marginTop) < 0) first.after(top); else main.prepend(top);
    const stamp = main.querySelector(".buildstamp"), low = showBar(a, pick());
    if(stamp) main.insertBefore(low, stamp); else main.appendChild(low);
  }
  // the floating button is always the casino (Lola wants it promoted every day); people who've asked
  // for no pokies get today's app there instead. The pokie machine stays on the casino page (it spins up
  // a random game); any other app leaves it off its own page.
  const pokies = showcaseApp("pokies"), fa = canSee(pokies) ? pokies : a;
  if(page !== fa.page || fa.id === "pokies"){
    const f = document.createElement("a");
    f.className = "pokiefloat showbit" + (fa.id === "pokies" ? " show-casino lever" : ""); f.href = fa.page; f.style.cssText = themeVars(fa);
    if(fa.id === "pokies"){ f.dataset.game = ""; f.setAttribute("aria-label", "Play a random casino game"); }
    else f.setAttribute("aria-label", "Open " + fa.name);
    f.innerHTML = (fa.pic ? `<img class="pic" src="${fa.pic}" alt="">` : `<span class="win">${reels(fa, "<i>", "</i>", .7, .25)}</span>`) + `<span class="lbl">${esc(fa.lbl)}</span>`;
    document.body.appendChild(f);
  }
  watchDropzones();
}

function startShowcase(page){
  _showPage = page;
  paintShowcase(true);
  // every [data-game] link picks a fresh random pokie machine at the moment you tap it
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-game]"); if(!a) return;
    a.href = randomGame(true).url;
  }, true);
  settings("showcase").subscribe(s => {
    _show = s ? Object.fromEntries(Object.entries(s).filter(([k]) => k !== "id")) : {};
    try{ localStorage.setItem("xmas_showcase", JSON.stringify(_show)); }catch(e){}
    paintShowcase();
  });
  // someone hides the pokies or the trauma bits for themselves, or the day ticks over while the page is open
  ["xmas-showcase", "xmas-traumaoff"].forEach(ev => addEventListener(ev, () => paintShowcase()));
  document.addEventListener("visibilitychange", () => { if(!document.hidden) paintShowcase(); });
}

let _toastT = null;
export function toast(msg, ms = 2600){
  let t = document.getElementById("xmas-toast");
  if(!t){ t = document.createElement("div"); t.id = "xmas-toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.remove("hide");
  clearTimeout(_toastT); _toastT = setTimeout(() => t.classList.add("hide"), ms);
}

export function banner(msg){
  const main = document.querySelector("main"); if(!main) return;
  let b = document.getElementById("xmas-banner");
  if(!b){ b = document.createElement("div"); b.id = "xmas-banner"; b.className = "banner"; main.prepend(b); }
  b.textContent = msg;
}

/** Bottom sheet. Returns { el, close }. html is the inside of the sheet. */
export function openSheet(html, onClose){
  closeSheet();
  const scrim = document.createElement("div"); scrim.className = "scrim"; scrim.id = "xmas-scrim";
  const sh = document.createElement("div"); sh.className = "sheet"; sh.id = "xmas-sheet";
  sh.setAttribute("role", "dialog");
  sh.innerHTML = `<div class="grab"></div>` + html;
  scrim.addEventListener("click", () => closeSheet());
  document.body.append(scrim, sh);
  sh._onClose = onClose;
  const f = sh.querySelector("input,textarea,select"); if(f && !("ontouchstart" in window)) f.focus();
  return { el: sh, close: closeSheet };
}
export function closeSheet(){
  const sh = document.getElementById("xmas-sheet");
  if(sh && sh._onClose) sh._onClose();
  sh && sh.remove(); document.getElementById("xmas-scrim")?.remove();
}
addEventListener("keydown", e => { if(e.key === "Escape") closeSheet(); });

export function lightbox(src, caption){
  const lb = document.createElement("div"); lb.className = "lightbox";
  lb.innerHTML = `<div><img src="${src}" alt=""><p>${esc(caption || "")}</p></div>`;
  lb.addEventListener("click", () => lb.remove());
  document.body.appendChild(lb);
}

/* The family photos that ship with the site — every page header (and the front page) shows one at random.
   SHOT_META says where the face is in each one, so the crop lands on it. */
export const BUILTIN_SHOTS = Array.from({ length: 20 }, (_, i) => `bg-${String(i + 1).padStart(2, "0")}.jpg`);
/* for each photo: [how far down the face is (0–1), height ÷ width] — used to land the crop on the face */
export const SHOT_META = {"bg-01.jpg": [0.47, 1.077],
  "bg-02.jpg": [0.17, 1.777],
  "bg-03.jpg": [0.42, 1.205],
  "bg-04.jpg": [0.42, 1.143],
  "bg-05.jpg": [0.42, 1.353],
  "bg-06.jpg": [0.5, 1.165],
  "bg-07.jpg": [0.4, 1.603],
  "bg-08.jpg": [0.47, 1.282],
  "bg-09.jpg": [0.45, 1.045],
  "bg-10.jpg": [0.6, 1.35],
  "bg-11.jpg": [0.33, 1.491],
  "bg-12.jpg": [0.47, 1.3],
  "bg-13.jpg": [0.42, 1.389],
  "bg-14.jpg": [0.48, 0.941],
  "bg-15.jpg": [0.42, 1.067],
  "bg-16.jpg": [0.4, 0.921],
  "bg-17.jpg": [0.5, 1.192],
  "bg-18.jpg": [0.5, 1.0],
  "bg-19.jpg": [0.45, 1.314],
  "bg-20.jpg": [0.45, 1.121]};
/** Where to put the background so the face sits in the middle of a box this size. */
export function shotY(src, boxW, boxH){
  const m = SHOT_META[src]; if(!m || !boxW || !boxH) return "38%";
  const [f, r] = m, imgH = Math.max(boxW * r, boxH);          // "cover": the photo is at least as tall as the box
  if(imgH - boxH < 1) return "50%";
  return Math.round(Math.min(1, Math.max(0, (f * imgH - boxH / 2) / (imgH - boxH))) * 100) + "%";
}
/** A random family photo, never the one this phone saw last. Returns {src}. */
export function randomShot(extra = []){
  const pool = [...BUILTIN_SHOTS, ...extra], last = sessionStorage.getItem("xmas_last_hero");
  const opts = pool.filter(x => x.slice(-80) !== last);
  const p = (opts.length ? opts : pool)[Math.floor(Math.random() * (opts.length || pool.length))];
  try{ sessionStorage.setItem("xmas_last_hero", p.slice(-80)); }catch(e){}
  return { src:p };
}
/** Header photo: one of the family photos straight away; photos from the wall join the draw once they've loaded. */
export function heroFromWall(sel = ".top"){
  const el = document.querySelector(sel); if(!el) return;
  const show = s => { el.style.setProperty("--hero", `url("${s.src}")`); el.style.setProperty("--hero-y", s.y || shotY(s.src, el.offsetWidth, el.offsetHeight)); el.classList.add("photo"); };
  show(randomShot());
  let joined = false;
  col("wall").subscribe(rows => {
    if(joined) return; joined = true;
    const wall = rows.filter(r => r.bg !== false).map(r => r.data).filter(Boolean);
    // give wall photos their fair share of turns
    if(wall.length && Math.random() < wall.length / (wall.length + BUILTIN_SHOTS.length)) show({ src: wall[Math.floor(Math.random() * wall.length)], y:"40%" });
  });
}

/** Shrink a photo in the browser so it fits in a Firestore document (aim ~200KB). */
export function compressImage(file, maxSide = 1400, target = 200 * 1024){
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let side = maxSide, q = 0.8, out = "";
      for(let tries = 0; tries < 8; tries++){
        const k = Math.min(1, side / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        out = cv.toDataURL("image/jpeg", q);
        if(out.length * 0.75 <= target) break;
        if(q > 0.55) q -= 0.1; else side = Math.round(side * 0.8);
      }
      res(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("That file isn't a photo we can read")); };
    img.src = url;
  });
}


console.info("Bateau Bay Christmas build", BUILD);
