/* ============================================================
   Christmas at Bateau Bay — who's coming.
   Straight from the family RSVP sheet. Dates, cabins and notes
   can be changed in the app (Who's coming → tap a family), and
   extra people can be added from the front page.
   ============================================================ */

/* id, family surname, the names, when they arrive and leave, cabin or caravan.
   stay:"Not coming" = in the family list but not at camp (left out of camp numbers). */
export const HOUSEHOLDS = [
  { id:"h01", surname:"Townsend",   people:["Lauren","Daisy","Brendon"],               arrive:"2026-12-21", leave:"2026-12-28", stay:"Cabin",   note:"" },
  { id:"h02", surname:"Townsend",   people:["Topsy"],                                  arrive:"2026-12-23", leave:"2026-12-28", stay:"Cabin",   note:"" },
  { id:"h03", surname:"Townsend",   people:["Mikayla","Flynn"],                        arrive:"2026-12-21", leave:"2026-12-28", stay:"Cabin",   note:"Mikayla is happy to run the club / be an organiser" },
  { id:"h04", surname:"Townsend",   people:["Holli","Nia"],                            arrive:"2026-12-21", leave:"2026-12-28", stay:"Cabin",   note:"" },
  { id:"h05", surname:"Richards",   people:["Sam","Caprice"],                          arrive:"2026-12-23", leave:"2026-12-27", stay:"Cabin",   note:"Sam's girlfriend is coming 26th–28th" },
  { id:"h06", surname:"Rostron",    people:["Gemma","Georgia","Tayla"],                arrive:"2026-12-23", leave:"2026-12-28", stay:"Cabin",   note:"" },
  { id:"h07", surname:"Chatterton", people:["Kay","Roy","Mark"],                       arrive:"2026-12-23", leave:"2026-12-28", stay:"Cabin",   note:"" },
  { id:"h08", surname:"Langford",   people:["Trudi","Clint","Jack"],                   arrive:"2026-12-23", leave:"2026-12-30", stay:"Cabin",   note:"" },
  { id:"h09", surname:"Richards",   people:["Kristy","Jason","Nate","Charlie"],        arrive:"2026-12-23", leave:"2026-12-28", stay:"Caravan", note:"" },
  { id:"h10", surname:"Rostron",    people:["Ken","Lynda"],                            arrive:"2026-12-23", leave:"2026-12-28", stay:"Cabin",   note:"" },
  { id:"h11", surname:"Rostron",    people:["Adam","Sunny","Jack"],                    arrive:"2026-12-23", leave:"2026-12-28", stay:"Cabin",   note:"" },
  { id:"h12", surname:"Rostron",    people:["Sally","Steve","Mila","Zara"],            arrive:"2026-12-24", leave:"2026-12-28", stay:"Caravan", note:"" },
  { id:"h13", surname:"Townsend",   people:["Shawn","Prue","Cooper","Isla","Josh"],    arrive:"2026-12-23", leave:"2026-12-28", stay:"Cabin",   note:"" },
  { id:"h14", surname:"Townsend",   people:["Lochie","Anna"],                          arrive:"2026-12-23", leave:"2026-12-26", stay:"Cabin",   note:"Lochie is bringing dinner rolls and an activity. Here until the 26th." },
  { id:"h15", surname:"Townsend",   people:["Donald","Lisa","Dana","Lanie"],           arrive:"",           leave:"",           stay:"Not coming", note:"Not coming to Xmas camp" },
  /* Donald Townsend's grandkids with other surnames. No dates yet — change them in Who's coming if they come to camp. */
  { id:"h16", surname:"Kaser",      people:["Flynn","Eli"],                            arrive:"",           leave:"",           stay:"Not coming", note:"Donald Townsend's grandkids" },
  { id:"h17", surname:"Donald's grandkids", people:["Will","Josh","Bridie","Liam"],    arrive:"",           leave:"",           stay:"Not coming", note:"Donald Townsend's grandkids" },
  /* Trudi & Clint's daughter. In the navy, so not sure yet if she can come — set her dates in Who's coming if she can. */
  { id:"h18", surname:"Langford",   people:["Reese"],                                  arrive:"",           leave:"",           stay:"Not coming", note:"In the navy — not sure yet if she can make it" }
];

/* surnames in the order they're shown. A family with no surname
   (someone added a new family in the app) goes under "More family". */
export const SURNAMES = ["Townsend","Kaser","Donald's grandkids","Chatterton","Rostron","Richards","Langford"];

/* one colour per family, used for dots, bars and ladders */
export const HH_COLOURS = ["#D8352A","#1F8A5B","#F2B33D","#1AA5B8","#FF7A59","#8E5BD0","#2C86C3",
                           "#E77FA0","#5A9E3A","#C97A1E","#0E7C86","#B0447A","#4A6FD0","#A4563B","#6B7F2A"];

/* Christmas lunch — who's bringing what, from the family food list.
   Loaded into the meal roster the first time someone taps "Start with the family list". */
export const XMAS_FOOD = [
  { dish:"Hams",                              who:"Chattertons" },
  { dish:"Chickens × 5",                      who:"Townsends" },
  { dish:"Prawns × 5 kg?",                    who:"Rostrons" },
  { dish:"Pasta salad",                       who:"Lynda and Prue" },
  { dish:"Salads × 5",                        who:"Each family" },
  { dish:"Rice dish",                         who:"Lynda and Trudi" },
  { dish:"Potato bakes / vegie bakes × 3",    who:"Gemma and Lauren" },
  { dish:"Dinner rolls",                      who:"Lochie" },
  { dish:"Desserts × 3",                      who:"Kay and Kristy" },
  { dish:"Trifle",                            who:"Topsy" },
  { dish:"Snacks & nibbles",                  who:"All families" },
  { dish:"Boxing Day breakfast cook-up — bacon, eggs etc", who:"All families", meal:"boxing" }
];
