/* Does a water polygon get called what it actually is?

   Every case here is a real tag combination pulled from Overpass over the
   Galilee, the Jordan Valley and the Dead Sea. The bare natural=water ones
   are the bug this guards: 1,148 of 2,611 polygons in that box carry no
   subtype at all, and many are named "ma'agar" — reservoir — in Hebrew. */
const ENV = require("./env");
const { waterKind, WATER_FILLED } = ENV.extract(
  /const NOT_LAKE_RE[\s\S]*?const WATER_FILLED = \{[^}]*\};/,
  ["waterKind", "WATER_FILLED"]);

const CASES = [
  [{natural:"water",water:"lake",name:"ימת הכנרת","name:en":"Sea of Galilee",intermittent:"no",salt:"no"}, "lake", 1],
  [{natural:"water",water:"lake",name:"البحر الميت ים המלח","name:en":"Dead Sea",salt:"yes"}, "saltlake", 1],
  [{natural:"water",water:"lake",name:"אגם פארק ענבה"}, "lake", 1],
  [{natural:"water",name:"מאגר בזלת"}, "unspecified", 0],
  [{natural:"water",name:"מאגר יקוצה"}, "unspecified", 0],
  [{natural:"water",name:"אגם עופות הים"}, "unspecified", 0],
  [{natural:"water",water:"lake",name:"מלחת סדום"}, "reservoir", 0],
  [{landuse:"reservoir",name:"מאגר כפר ברוך"}, "reservoir", 0],
  [{natural:"water",water:"reservoir",intermittent:"yes",name:"מאגר עונתי"}, "seasonal", 0],
  [{natural:"water",water:"lake",seasonal:"yes",name:"אגם חורף"}, "seasonal", 0],
  [{landuse:"salt_pond",name:"בריכות אידוי"}, "saltpond", 0],
  [{natural:"water",water:"pond",name:"בריכת סאסא"}, "pond", 0],
  [{natural:"water",water:"basin",name:"בריכת שיקוע"}, "basin", 0],
  [{natural:"water",water:"lake","name:en":"Kfar Baruch Reservoir"}, "reservoir", 0]
];

let bad = 0;
for (const [tags, kind, filled] of CASES){
  const k = waterKind(tags);
  const f = WATER_FILLED[k] ? 1 : 0;
  const ok = k === kind && f === filled;
  if (!ok) bad++;
  console.log((ok ? "ok  " : "FAIL"), (tags["name:en"] || tags.name || "").padEnd(24),
              "->", k.padEnd(12), "filled=" + f, ok ? "" : "(wanted " + kind + "/" + filled + ")");
}
console.log(bad ? bad + " FAILED" : "all " + CASES.length + " pass");
process.exit(bad ? 1 : 0);
