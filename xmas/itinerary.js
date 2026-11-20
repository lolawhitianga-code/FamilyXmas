/* ============================================================
   The Townsend Family Christmas itinerary, 23–28 December 2026,
   from the family's Word document. One tap on the Planner loads
   it all in: the day-by-day plan, the competitions, the dinners
   and the bring-list. After that it's ordinary site content that
   anyone can edit, move or delete.
   ids never change — they stop anything being added twice.
   ============================================================ */
export const ITIN_VERSION = 6;
/* Anything added after the first load carries v: the version it arrived in. When the site already has an
   older version loaded, the Planner offers to load just the newer bits — it never re-adds things people deleted.
   An entry with was:{…} is a CHANGE to something already loaded: it's only applied if nobody has edited it since. */

/* slot is worked out from the time unless given: before noon = morning, before 5pm = midday, else evening */
export const ITINERARY = [
  // ---- Wednesday 23 December
  { id:"i2-23-0700", date:"2026-12-23", time:"07:00", text:"Travel day" },
  { id:"i2-23-1400", date:"2026-12-23", time:"14:00", text:"Check in" },
  { id:"i2-23-1500", date:"2026-12-23", time:"15:00", text:"Caravan park tour & welcomes — organisers: Lauren & Holli" },
  { id:"i2-23-1700", date:"2026-12-23", time:"17:00", text:"Dinner — pizza night! Topsy's birthday surprise and welcome drinks — organisers: Lauren, Holli & Brendon" },
  { id:"i2-23-1900", date:"2026-12-23", time:"19:00", text:"Birthday cake" },
  { id:"i2-23-2000", date:"2026-12-23", time:"20:00", text:"Late night pool swims and races — organisers: Mikayla & Charlie", v:4, was:{ text:"Late night pool swims and races" } },
  // ---- Thursday 24 December — Christmas Eve
  { id:"i2-24-0600", date:"2026-12-24", time:"06:00", text:"Run / walk / coffee club — organisers: Lochie & Mikayla" },
  { id:"i2-24-0900", date:"2026-12-24", time:"09:00", text:"Beach games & activities — organisers: Sam, Jack & Adam", v:4, was:{ text:"Beach games & activities — organisers: Sam & Jack" } },
  { id:"i2-24-1100", date:"2026-12-24", time:"11:00", text:"Pool aqua & swims — organisers: Lynda & Lauren", v:4, was:{ text:"Pool aqua & swims — organisers: Kay & Lynda" } },
  { id:"i2-24-lunch",date:"2026-12-24", time:"",      slot:"noon", text:"Lunch — BYO to the BBQ area" },
  { id:"i2-24-1400", date:"2026-12-24", time:"14:00", text:"Bateau Bay history driving tour — organisers: Prue, Kay & Topsy" },
  { id:"i2-24-1600", date:"2026-12-24", time:"16:00", text:"Kay's photo booth — guess the baby! — organisers: Kay & Zara" },
  { id:"i2-24-1700", date:"2026-12-24", time:"17:00", text:"Get ready for dinner at the club" },
  { id:"i2-24-1800", date:"2026-12-24", time:"18:00", text:"Bowling Club dinner — Hawaiian theme" },
  { id:"i2-24-1845", date:"2026-12-24", time:"18:45", text:"Family trivia — organisers: Kay, Mark & Daisy" },
  { id:"i2-24-2100", date:"2026-12-24", time:"21:00", text:"Home & bed, ready for Santa" },
  // ---- Friday 25 December — Christmas Day
  { id:"i2-25-0700", date:"2026-12-25", time:"07:00", text:"Church — Christmas attire theme" },
  { id:"i2-25-0800", date:"2026-12-25", time:"08:00", text:"Christmas Day set-up & decorations — organisers: Tayla, Lynda & Sunny" },
  { id:"i2-25-0900", date:"2026-12-25", time:"09:00", text:"Christmas bingo starts, plus games & activities — organisers: Mikayla, Charlie, Georgie & Mila" },
  { id:"i2-25-1045", date:"2026-12-25", time:"10:45", text:"WA FaceTime call" },
  { id:"i2-25-1100", date:"2026-12-25", time:"11:00", text:"Steal & Grab gift swap — organisers: Gem & Isla", link:"santa.html", v:5, was:{ text:"Secret Santa — organisers: Gem & Isla" } },
  { id:"i2-25-1200", date:"2026-12-25", time:"12:00", text:"Family photos" },
  { id:"i2-25-1230", date:"2026-12-25", time:"12:30", text:"Christmas Day lunch", link:"food.html#lunch" },
  { id:"i2-25-1400", date:"2026-12-25", time:"14:00", text:"Christmas Day cricket match — organisers: Shawn, Cooper & Nate" },
  { id:"i2-25-1500", date:"2026-12-25", time:"15:00", text:"Cocktails & slushies — organisers: Trudi, Sam & Sally", v:4, was:{ text:"Cocktails & slushies" } },
  { id:"i2-25-1600", date:"2026-12-25", time:"16:00", text:"Christmas bingo finishes" },
  { id:"i2-25-1800", date:"2026-12-25", time:"18:00", text:"Townsends Got Talent show — hosts: Ken & Kay. Every family must do a family heritage dance! Plus bring a special talent: music, juggling, dance, poem, story…", v:6, was:{ text:"Townsends Got Talent show — hosts: Ken & Kay. Bring a special talent: music, juggling, dance, poem, story…" } },
  // ---- Saturday 26 December — Boxing Day
  { id:"i2-26-0500", date:"2026-12-26", time:"06:00", text:"Barocas & deep breathe work, followed by a sunrise beach swim — organisers: Sally & Prue", v:4, was:{ text:"Sunrise yoga & meditation — organisers: Trudi & Sally" } },
  { id:"i2-26-0700", date:"2026-12-26", time:"07:00", text:"Bacon & egg cook-up and leftovers" },
  { id:"i2-26-0900", date:"2026-12-26", time:"09:00", text:"Kristy's golf lessons — organisers: Kristy, Jack & Josh" },
  { id:"i2-26-1200", date:"2026-12-26", time:"12:00", text:"BYO lunch" },
  { id:"i2-26-1300", date:"2026-12-26", time:"13:00", text:"Naps" },
  { id:"i2-26-1500", date:"2026-12-26", time:"15:00", text:"The Amazing Race hunt — organisers: Gem & Tayla. Bring phones, swimmers, money and snacks" },
  { id:"i2-26-1800", date:"2026-12-26", time:"18:00", text:"Dinner — picked up on the way round the Amazing Race course" },
  { id:"i2-26-1900", date:"2026-12-26", time:"19:00", text:"Late night beach and pool swims — organisers: Mark & Brendon", v:4, was:{ text:"Late night beach and pool swims" } },
  // ---- Sunday 27 December
  { id:"i2-27-0500", date:"2026-12-27", time:"05:00", text:"Family meditation and silent walks or silent beach swims — organisers: Trudi & Mark", v:4, was:{ text:"Family meditation and silent walks or silent beach swims — organisers: Trudi & Sally" } },
  { id:"i2-27-0700", date:"2026-12-27", time:"07:00", text:"GYO breakfast (get your own)", v:4, was:{ text:"Bacon & egg cook-up and leftovers" } },
  { id:"i2-27-0900", date:"2026-12-27", time:"09:00", text:"Chicken Run bowls competition (bowls attire please) — organisers: Ken, Chatto, Adam & Jack" },
  { id:"i2-27-1100", date:"2026-12-27", time:"11:00", text:"Awards ceremony", link:"awards.html" },
  { id:"i2-27-1200", date:"2026-12-27", time:"12:00", text:"Lunch at the bowlo" },
  { id:"i2-27-1400", date:"2026-12-27", time:"14:00", text:"Townsend Family Olympics — organisers: Mikayla, Josh & Steve W", v:4, was:{ text:"Townsend Family Olympics — organisers: Mikayla, Josh & Sam" } },
  { id:"i2-27-1800", date:"2026-12-27", time:"18:00", text:"Farewell dinner & favourite memories of the trip activity", v:4, was:{ text:"Farewell dinner — TBC" } },
  { id:"i2-27-2100", date:"2026-12-27", time:"21:00", text:"Late night card competition — organisers: Jason & Clint" },
  // ---- Monday 28 December
  { id:"i2-28-0600", date:"2026-12-28", time:"06:00", text:"Run / walk / coffee club — organisers: Mikayla & Georgie", v:4, was:{ text:"Run / walk / coffee club — organisers: Lochie & Mikayla" } },
  { id:"i2-28-0700", date:"2026-12-28", time:"07:00", text:"Last goodbye breakfast — eat everything in the fridge" },
  { id:"i2-28-0800", date:"2026-12-28", time:"08:00", text:"Time to say goodbye" },
  { id:"i2-28-1000", date:"2026-12-28", time:"10:00", text:"Caravan park goodbyes and check out" }
];

/* the competitions, ready for results on the Tournaments page */
export const ITIN_EVENTS = [
  { id:"ev-trivia",   name:"Family trivia",                  emoji:"🧩", date:"2026-12-24", time:"18:45", where:"Bowling Club",  sides:"teams",  note:"Organisers: Kay, Mark & Daisy" },
  { id:"ev-baby",     name:"Guess the baby photo booth",     emoji:"👶", date:"2026-12-24", time:"16:00", where:"",              sides:"people", note:"Organisers: Kay & Zara" },
  { id:"ev-dressed",  name:"Best dressed — Christmas attire", emoji:"🎅", date:"2026-12-25", time:"07:00", where:"",              sides:"people", note:"Christmas attire theme" },
  { id:"ev-bingo",    name:"Christmas bingo",                emoji:"🎱", date:"2026-12-25", time:"09:00", where:"",              sides:"people", note:"Runs 9am–4pm. Organisers: Mikayla, Charlie, Georgie & Mila" },
  { id:"ev-cricket",  name:"Christmas Day cricket match",    emoji:"🏏", date:"2026-12-25", time:"14:00", where:"",              sides:"teams",  note:"Organisers: Shawn, Cooper & Nate" },
  { id:"ev-talent",   name:"Townsends Got Talent",           emoji:"🎤", date:"2026-12-25", time:"18:00", where:"",              sides:"families", note:"Hosts: Ken & Kay. Every family must do a family heritage dance! Plus bring a special talent", v:6, was:{ sides:"people", note:"Hosts: Ken & Kay. Bring a special talent" } },
  { id:"ev-race",     name:"The Amazing Race hunt",          emoji:"🏁", date:"2026-12-26", time:"15:00", where:"",              sides:"teams",  note:"Organisers: Gem & Tayla. Bring phones, swimmers, money and snacks" },
  { id:"ev-bowls",    name:"Chicken Run bowls competition",  emoji:"🥏", date:"2026-12-27", time:"09:00", where:"Bowling Club",  sides:"teams",  note:"Bowls attire please. Organisers: Ken, Chatto, Adam & Jack" },
  { id:"ev-olympics", name:"Townsend Family Olympics",       emoji:"🏅", date:"2026-12-27", time:"14:00", where:"",              sides:"teams",  note:"Organisers: Mikayla, Josh & Steve W", v:4, was:{ note:"Organisers: Mikayla, Josh & Sam" } },
  { id:"ev-cards",    name:"Late night card competition",    emoji:"🃏", date:"2026-12-27", time:"21:00", where:"",              sides:"people", note:"Organisers: Jason & Clint" },
  { id:"ev-markorsam", v:3, name:"Was it Mark or was it Sam?!", emoji:"🤔", date:"", time:"", where:"", sides:"people",
    note:"Someone tells a past incident — nothing's off limits — and Roy has to decide: was it Mark or was it Sam? Adam may join the line-up at some point." }
];

/* the dinners the itinerary already decides */
export const ITIN_DINNERS = [
  { id:"dn-23", date:"2026-12-23", who:"Everyone", what:"Pizza night — Topsy's birthday", note:"5pm. Organisers: Lauren, Holli & Brendon" },
  { id:"dn-24", date:"2026-12-24", who:"Everyone", what:"Bowling Club dinner — Hawaiian theme", note:"6pm at the club" },
  { id:"dn-26", date:"2026-12-26", who:"Everyone", what:"Picked up on the Amazing Race course", note:"6pm" },
  { id:"dn-27", date:"2026-12-27", who:"Everyone", what:"Farewell dinner & favourite memories of the trip", note:"6pm", v:4, was:{ what:"Farewell dinner — TBC" } }
];

/* the equipment checklist — goes on the "Everything else" shopping list */
export const ITIN_GEAR = [
  { id:"gr-bonbons", text:"Xmas bon bons",                        forWhat:"Everyone" },
  { id:"gr-plates",  text:"Paper plates, bowls & cutlery",        forWhat:"Everyone" },
  { id:"gr-floats",  text:"Pool floats & games equipment",        forWhat:"Everyone" },
  { id:"gr-cricket", text:"Cricket bat and ball",                 forWhat:"Cooper & Nate" },
  { id:"gr-cake",    text:"Birthday cake and decorations",        forWhat:"Lauren & Bren" },
  { id:"gr-tree",    text:"Small Christmas tree & decorations",   forWhat:"Gem & Lynda" },
  { id:"gr-hawaii",  text:"Hawaiian themed outfit",               forWhat:"Everyone" },
  { id:"gr-outfit",  text:"Christmas themed outfit",                 forWhat:"Everyone", v:4, was:{ text:"Christmas Day outfit" } },
  { id:"gr-santa",   v:5, text:"Wrapped Steal & Grab gift — funny, homemade or free (up to $25)", forWhat:"Everyone", was:{ text:"$20–25 Secret Santa present" } },
  { id:"gr-attire",  v:4, text:"Bowls & golf attire",                  forWhat:"Everyone" }
];
