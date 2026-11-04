// Source-port reference and guarded replay for the exact 3.76.20 distribution.
// All replacements are staged and checked before any target file is written.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const ownRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(process.argv[2] || ownRoot), staged = new Map();
const read = path => staged.get(path) ?? readFileSync(resolve(root, path), 'utf8');
function edit(path, from, to) {
  const source = read(path);
  if (source.split(from).length !== 2) throw Error('Unexpected build: ' + path + ' / ' + from.slice(0, 70));
  staged.set(path, source.replace(from, to));
}
const start = 'assets/start-VKBk-233.js';
const food = 'assets/Prehrana-OixX-60h.js';
edit('assets/index-B0oLxdFS.js', 'ct="3.76.20"', 'ct="3.76.21"');

// Today must use Nutrition's complete daily menu to select recipes. Removing
// the pre-workout slot before recipe selection changes the other recipes too.
edit(start, 'weather:e.weather,day:r,today:r,hour:l}),p=d.dp.rideDone?',
  'weather:e.weather,day:r,today:r,hour:l,prefs:c.foodPrefs}),p=d.dp.rideDone?');
edit(start, 'const h=Jy(p,r,Yy(t,a,c,d.training),c)[f.key]',
  'const h=Jy(d.dp,r,Yy(t,a,c,d.training),c)[f.key]');

// A strength activity with only some planned sets is not a completed day.
edit(start, 'dt=Ee.length>0&&Ee.every(rt=>rt.done),ot=',
  'dt=Ee.length>0&&Ee.every(rt=>rt.done&&!pi(rt,l)),partialDay=Ee.some(rt=>rt.done&&pi(rt,l)),ot=');
edit(start, '${dt?n(", opravljeno"):""}',
  '${dt?n(", opravljeno"):partialDay?", "+n("delno"):""}');
edit(start, 'children:dt?u.jsx(wo,{className:"day-ok",width:12,height:12,"aria-hidden":"true"}):Ee.some',
  'children:dt?u.jsx(wo,{className:"day-ok",width:12,height:12,"aria-hidden":"true"}):partialDay?u.jsx("span",{className:"day-part","aria-hidden":"true"}):Ee.some');
edit(start, 'v.done?u.jsx(an,{sm:!0,on:!0,children:pi(v,l)??n("opravljeno")}):Rm?',
  'v.done?pi(v,l)?u.jsx("span",{className:"chip sm partial-tag",children:pi(v,l)}):u.jsx(an,{sm:!0,on:!0,children:n("opravljeno")}):Rm?');

// Resume is a primary action, placed before the long exercise list.
const resume = 'v.done&&v.kind==="moc"&&pi(v,l)&&u.jsx("button",{className:"chip sm click",onClick:()=>De("vadba",{id:v.id,od:"ostanek"}),children:n("Nadaljuj")}),';
edit(start, resume, '');
edit(start, ']}),ei.filter(D=>D.kind==="delo").length>=2?',
  ']}),v.done&&v.kind==="moc"&&pi(v,l)&&u.jsx("button",{type:"button",className:"btn primary block","data-t":"nadaljuj-delno",style:{marginTop:12},onClick:()=>De("vadba",{id:v.id,od:"ostanek"}),children:n("Nadaljuj trening")}),ei.filter(D=>D.kind==="delo").length>=2?');
edit(start, 'export{QS as $', 'export{pi as partialWorkoutLabel,QS as $');
edit(food, 'import{r as g', 'import{useMealDraft as __useMealDraft}from"./meal-draft-37621.js";import{partialWorkoutLabel as __partialWorkoutLabel}from"./start-VKBk-233.js";import{r as g');
edit(food, '${d.done||L.some(se=>va(se,d))?" ✓":""}',
  '${__partialWorkoutLabel(d,L)?" · "+__partialWorkoutLabel(d,L):d.done||L.some(se=>va(se,d))?" ✓":""}');

// React owns the draft state; session storage only keeps a scoped backup.
edit(food, 'function ol({onPot:', 'function ol({draftKey:__draftKey="",onPot:');
edit(food, '[z,u]=g.useState(j),[M,v]=g.useState(!1)',
  '[z,u]=__useMealDraft({key:__draftKey,initial:j,clearKey:f}),[M,v]=g.useState(!1)');
edit(food, 'g.useEffect(()=>{u(j)},[j]),g.useEffect(()=>{f&&u("")},[f]),', '');
edit(food, 'e.jsx(ol,{onPot:', 'e.jsx(ol,{draftKey:JSON.stringify([t.user?.uid??"guest",u]),onPot:');
edit(food, 'clearKey:Ds}),Ye.length', 'clearKey:Ds},JSON.stringify([t.user?.uid??"guest",u])),Ye.length');

// Do not replace button semantics with a listitem role on clickable shortcuts.
edit(food, 'className:"slot-strip",role:"list"', 'className:"slot-strip",role:"group"');
edit(food, 'type:"button",role:"listitem",className:', 'type:"button",className:');
const css = 'assets/index-C0dNuGMz.css';
staged.set(css, read(css) + '\n/* Partial workouts remain visibly distinct from completion. */\n.day-part{display:block;width:10px;height:10px;border:1.5px solid var(--warn);border-radius:50%;background:linear-gradient(90deg,var(--warn) 50%,transparent 50%)}.day.today .day-part{border-color:currentColor;background:linear-gradient(90deg,currentColor 50%,transparent 50%)}.chip.partial-tag{color:var(--warn);border-color:var(--warn);background:transparent}\n');
const draft = 'assets/meal-draft-37621.js';
staged.set(draft, readFileSync(resolve(ownRoot, draft), 'utf8'));
let sw = read('sw.js');
for (const [path, content] of staged) {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(url:"' + escaped + '",revision:)(?:null|"[^"]+")(})');
  const hash = createHash('md5').update(content).digest('hex');
  if (path === draft) {
    const marker = '{url:"assets/start-VKBk-233.js",revision:';
    if (sw.split(marker).length !== 2) throw Error('Unexpected precache format');
    sw = sw.replace(marker, `{url:"${draft}",revision:"${hash}"},` + marker);
  } else {
    if (!re.test(sw)) throw Error('Missing precache record: ' + path);
    sw = sw.replace(re, '$1"' + hash + '"$2');
  }
}
staged.set('sw.js', sw);
staged.set('hotfix/changed-files.json', JSON.stringify([...new Set([
  ...JSON.parse(read('hotfix/changed-files.json')), ...staged.keys()
])], null, 2) + '\n');
for (const [path, content] of staged) writeFileSync(resolve(root, path), content);
console.log(JSON.stringify({version:'3.76.21', changed:[...staged.keys()]}, null, 2));
