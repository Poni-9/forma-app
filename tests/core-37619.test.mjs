import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const start=read('assets/start-VKBk-233.js'),entry=read('assets/index-B0oLxdFS.js'),actions=read('assets/actions-DQA3mpOX.js');
const translate=(s,...args)=>s.replace(/\{(\d+)\}/g,(_,i)=>args[i]??`{${i}}`);
function extract(source,marker,expression=false){
  const at=source.indexOf(marker);assert.ok(at>=0,marker);
  for(let end=source.indexOf('}',at);end>=0;end=source.indexOf('}',end+1)){
    const code=source.slice(at,end+1);try{new vm.Script(expression?`(${code})`:code);return code;}catch{}
  }throw Error('Cannot extract '+marker);
}
const foods=vm.runInNewContext('('+extract(start.slice(start.indexOf('ue={')+3),'{',true)+')',{n:translate});
const foodContext=vm.createContext({on:foods,t:translate});
vm.runInContext(actions.slice(actions.indexOf('const wi='),actions.indexOf('const Ri=')),foodContext);
const parse=s=>vm.runInContext(`To(${JSON.stringify(s)})`,foodContext);

test('food quantities: written units and fractions retain exact proportional mass',()=>{
  for(const [input,kcal] of [['100 g banana',88],['200 g banana',175],['10 g banana',9],['1 g banana',1],['50 g banana',44],['0,2 kg banana',175],['20 dag banana',175],['banana, 100 g',88],['100 gramov banane',88],['0,2 kilograma banane',175],['20 dekagramov banane',175]])assert.equal(parse(input)?.kcal,kcal,input);
});
test('food quantities: pieces, multiple foods and zero quantities',()=>{
  for(const [input,kcal] of [['1 banana',105],['2 banani',210],['pol banane',53],['1/4 banane',26],['100 g oves',370],['100 g banana in 100 g oves',458],['2 x 100 g banana',175]])assert.equal(parse(input)?.kcal,kcal,input);
  assert.equal(parse('neznana hrana'),null);assert.equal(parse('0 g banana'),null);
});
test('food quantities: an explicitly weighed banana stays labelled in grams',()=>{
  for(const grams of [1,50,60,100,120,200,240])assert.equal(parse(`${grams} g banana`).items[0].qty,`${grams} g`);
});
test('weekly duration: exact hours and minutes; strength plus cardio on the same day',()=>{
  const c=vm.createContext({n:translate});
  vm.runInContext('const nt=e=>e.type==="fitnes"||e.type==="doma";'+extract(start,'function gn(')+'const Di=e=>e.length-gn(e).size;'+extract(start,'function ve(')+extract(start,'function cl('),c);
  for(const [mins,label] of [[[45,45,45],'2 h 15 min'],[[40,40,40],'2 h'],[[30,30,30],'1 h 30 min']]){
    const sessions=mins.map((min,day)=>({type:'fitnes',min,day}));assert.ok(vm.runInContext(`cl(${JSON.stringify({sessions})})`,c).includes(label));
  }
  assert.match(vm.runInContext('cl({sessions:[{type:"fitnes",min:45,day:1},{type:"tek",min:30,day:1}]})',c),/^1 dan.*1 h 15 min/);
});

const token='TEST_ONLY_FIREBASE_ID_TOKEN';
function authFixture(response){
  const calls=[],timers=new Set();let serial=0;
  const c=vm.createContext({P:'https://test.invalid',g:translate,AbortController,
    setTimeout:fn=>{timers.add(++serial);return serial;},clearTimeout:id=>timers.delete(id),
    fetch:async(url,options)=>{calls.push({url,options});if(response instanceof Error)throw response;return response;}
  });
  vm.runInContext(extract(entry,'async function Et(')+extract(entry,'async function $t('),c);
  return {c,calls,timers,url:()=>vm.runInContext(`$t('/strava/auth',${JSON.stringify(token)})`,c)};
}
test('OAuth: valid one-time ticket; token sent only in Authorization header',async()=>{
  const f=authFixture({ok:true,json:async()=>({k:'k'.repeat(40)})});const url=await f.url();
  assert.equal(url,'https://test.invalid/strava/auth?k='+'k'.repeat(40));
  assert.ok(!url.includes(token));assert.equal(f.calls[0].options.headers.Authorization,'Bearer '+token);
  assert.ok(!f.calls[0].url.includes(token));assert.equal(f.timers.size,0);
});
for(const [name,response] of [
  ['HTTP 503',{ok:false}],['offline',new Error('fetch failed')],
  ['malformed ticket',{ok:true,json:async()=>({k:'bad'})}],
  ['null JSON',{ok:true,json:async()=>null}],
  ['broken JSON',{ok:true,json:async()=>{throw Error('bad JSON');}}]
])test('OAuth fails closed: '+name,async()=>{const f=authFixture(response);await assert.rejects(f.url(),/poskusi znova/);assert.equal(f.timers.size,0);});
test('OAuth: all providers and legacy URL helpers use the ticket helper',()=>{
  for(const path of ['assets/client-D8JJCPky.js','assets/client-BCUDZr0T.js','assets/pushClient-CfZJs5Bl.js']){
    const code=read(path);assert.ok(!/\/auth\?t=/.test(code),path);assert.match(code,/location\.href=await/);
  }
});

test('calendar export: filtering, escaped user text, multiple sessions and midnight rollover',()=>{
  const c=vm.createContext({t:translate,L:()=>null,k:min=>`${min} min`,Blob,URL});
  const source=read('assets/ics-0nu6Uaze.js').replace(/import[^;]+;/g,'').replace(/export\{[^;]+;/g,'');vm.runInContext(source,c);
  const plan=[{date:'2026-11-04',kind:'kolo',title:'Kolo, moč; test\nEND:VEVENT',durationMin:90},{date:'2026-11-04',kind:'moc',title:'Moč',durationMin:40},{date:'2026-11-05',kind:'pocitek',title:'Počitek',durationMin:30},{date:'2026-11-05',kind:'kolo',title:'Done',durationMin:30,done:true}];
  c.plan=plan;const text=vm.runInContext('O(plan,23)',c);assert.equal((text.match(/^BEGIN:VEVENT$/gm)||[]).length,2);
  assert.ok(text.includes('DTSTART:20261104T230000'));assert.ok(text.includes('DTEND:20261105T003000'));
  assert.ok(text.includes('\\,')&&text.includes('\\;')&&text.includes('\\nEND:VEVENT'));
});
test('CSV export: formula injection and Strava restrictions',()=>{
  const c=vm.createContext({r:translate,u:e=>e.source||'',Blob,URL});vm.runInContext(extract(start,'function FC(')+'const j=FC;',c);
  vm.runInContext(read('assets/csv-D4d_KlVd.js').replace(/import(?!\s*\()[^;]+;/g,'').replace(/export\{[^;]+;/g,''),c);
  const out=vm.runInContext('b([{date:"2026-11-04",slot:"kosilo",name:"=HYPERLINK(1)",kcal:100}])',c);assert.ok(out.includes("\"'=HYPERLINK(1)\""));
  assert.equal(vm.runInContext('l({source:"strava_api"})',c),false);assert.equal(vm.runInContext('l({source:"manual"})',c),true);
});
test('all active JavaScript parses; dependency files and named exports resolve',async()=>{
  const context=vm.createContext({}),modules=new Map();
  const moduleFor=name=>{if(modules.has(name))return modules.get(name);assert.ok(existsSync(resolve(root,name)),name);const m=new vm.SourceTextModule(read(name),{context,identifier:name});modules.set(name,m);return m;};
  const normalise=(specifier,from)=>specifier.startsWith('./')?dirname(from)+'/'+specifier.slice(2):specifier.replace(/^\//,'');
  const queue=['assets/index-B0oLxdFS.js'],seen=new Set();
  while(queue.length){const name=queue.pop();if(seen.has(name))continue;seen.add(name);const mod=moduleFor(name);
    for(const match of read(name).matchAll(/["']((?:\.\/|\/?assets\/)[^"'<> ]+\.js)["']/g))queue.push(normalise(match[1],name));
  }
  for(const m of modules.values())if(m.status==='unlinked')await m.link((specifier,parent)=>moduleFor(normalise(specifier,parent.identifier)));
  assert.ok(seen.size>100);console.log('Active module graph linked:',seen.size);
});
test('PWA: patched assets have matching cache revisions and release version',()=>{
  const sw=read('sw.js');for(const path of JSON.parse(read('hotfix/changed-files.json')).filter(p=>p.startsWith('assets/'))){
    const hash=createHash('md5').update(read(path)).digest('hex');assert.ok(sw.includes(`{url:"${path}",revision:"${hash}"}`),path);
  }assert.ok(entry.includes('ct="3.76.19"'));
});
