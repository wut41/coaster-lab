// Pure check of the Daily date helpers (copied verbatim from coaster_lab_v8_6.html 7423-7425) in many time zones.
const dayKey86=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dayNum86=k=>{const[y,m,d]=k.split('-').map(Number);return Math.round((Date.UTC(y,m-1,d)-Date.UTC(2026,0,1))/864e5)+1};
const prevDay86=k=>{const[y,m,d]=k.split('-').map(Number);return dayKey86(new Date(y,m-1,d-1))};
const [from, to] = (process.argv[2] || '2026-01-01:2031-01-01').split(':');
let bad = [], n = 0;
const ukey = t => new Date(t).toISOString().slice(0, 10);
for (let t = Date.parse(from); t < Date.parse(to); t += 864e5) {
  const k = ukey(t), want = ukey(t - 864e5); n++;
  const p = prevDay86(k); if (p !== want) bad.push(k + ' prev→' + p);
  if (dayNum86(k) - dayNum86(want) !== 1) bad.push(k + ' daynum step');
}
console.log(process.env.TZ, n, 'days', bad.length ? 'BAD ' + bad.slice(0, 5).join(', ') : 'ok');
