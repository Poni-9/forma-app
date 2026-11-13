// Actual active Garmin/auth-ticket modules with controlled transport and clock.
// No real accounts, OAuth grants, health data, or paid API requests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createContext, SourceTextModule, SyntheticModule} from 'node:vm';
import {activeGraph} from './active-graph.mjs';
const root=new URL('../',import.meta.url);
const ref=process.env.FORMAI_GARMIN_TEST_REF;
const read=p=>ref?execFileSync('git',['show',`${ref}:${p}`],{cwd:root,encoding:'utf8'}):readFileSync(new URL(p,root),'utf8');
const modules=[...activeGraph().modules];
const client=modules.find(p=>/^assets\/client-/.test(p)&&readFileSync(new URL(p,root),'utf8').includes('/garmin/status'));
assert.ok(client,'active Garmin client');
const ticketPath=read(client).match(/from"\.\/(authTicket-[^"]+)"/)?.[1];
const ticket='fixture_ticket_000000000000000000000000000000';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const ok=()=>json({k:ticket});
const error=status=>()=>json({error:'prijava'},status);
const network=()=>{throw new TypeError('Network/CORS failure');};
const hang=(_,options)=>new Promise((resolve,reject)=>{
  if(options.signal.aborted)return reject(new DOMException('aborted','AbortError'));
  options.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});
});
const sequence=(...steps)=>{let at=0;return(...args)=>steps[Math.min(at++,steps.length-1)](...args);};
const flush=async()=>{for(let i=0;i<45;i++)await Promise.resolve();};

async function fixture({ticketHandler=ok,statusHandler=()=>json({connected:false}),tokenHandler,online=true,session=true,language='sl'}={}) {
 const calls=[],tokens=[],redirects=[],timers=new Map();let time=100000,id=0;
 const state={user:session?{uid:'fixture-owner'}:null};
 class ClockDate extends Date {static now(){return time;}}
 const setTimer=(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id;};
 const context=createContext({Response,AbortController,DOMException,URLSearchParams,Date:ClockDate,navigator:{onLine:online},
  location:{set href(value){redirects.push(value);}},history:{replaceState(){}},
  setTimeout:setTimer,clearTimeout:n=>timers.delete(n),
  fetch:async(url,options={})=>{
   calls.push({path:new URL(url).pathname,options});
   const handler=new URL(url).pathname==='/api/auth/ticket'?ticketHandler:statusHandler;
   return handler(url,options);
  }});
 const strings=JSON.parse(readFileSync(new URL('hotfix/source/3.76.50/translations.json',root),'utf8'));
 const deps={index:{P:'https://proxy.invalid',t:s=>strings[language]?.[s]||s},
  start:{D:state,b:()=>session,aW:()=>new AbortController().signal,
   af:async(force=false)=>{tokens.push(force);return tokenHandler?tokenHandler(force):force?'fixture-fresh-token':'fixture-old-token';}}};
 const cache=new Map();
 async function load(path){
  if(cache.has(path))return cache.get(path);
  const mod=new SourceTextModule(read(path),{context,identifier:path});cache.set(path,mod);
  await mod.link(async spec=>{
   const kind=spec.startsWith('./index-')?'index':spec.startsWith('./start-')?'start':null;
   if(kind){const key='stub:'+kind;if(cache.has(key))return cache.get(key);
    const values=deps[kind],stub=new SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});cache.set(key,stub);return stub;}
   return load('assets/'+spec.replace(/^\.\//,''));
  });return mod;
 }
 const mod=await load(client);await mod.evaluate();
 const auth=cache.get('assets/'+ticketPath);
 return {api:mod.namespace,auth:auth.namespace,calls,tokens,redirects,timers,state,
  count:path=>calls.filter(c=>c.path===path).length,
  async tick(ms){await flush();const until=time+ms;for(;;){let next=null;for(const[n,v]of timers)if(v.at<=until&&(!next||v.at<next[1].at))next=[n,v];if(!next)break;time=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}time=until;await flush();},
 };
}
const rejected=async(promise,kind,status)=>assert.rejects(promise,e=>{assert.equal(e.kind,kind);if(status!==undefined)assert.equal(e.status,status);return true;});

test('valid ticket navigates once with only the one-time ticket in URL',async()=>{
 const f=await fixture();await f.api.s();assert.deepEqual(f.redirects,[`https://proxy.invalid/garmin/auth?k=${ticket}`]);
 assert.deepEqual(f.tokens,[false]);assert.equal(f.count('/garmin/status'),0);assert.equal(f.timers.size,0);
 assert.equal(f.calls[0].options.cache,'no-store');assert.equal(f.calls[0].options.headers.Authorization,'Bearer fixture-old-token');
});
test('readable 401 refreshes exactly once then recovers',async()=>{
 const f=await fixture({ticketHandler:sequence(error(401),ok)});await f.api.s();
 assert.deepEqual(f.tokens,[false,true]);assert.equal(f.count('/api/auth/ticket'),2);assert.equal(f.redirects.length,1);
 assert.equal(f.calls[1].options.headers.Authorization,'Bearer fixture-fresh-token');
});
test('CORS-hidden 401 is recovered only after readable status confirms rejection',async()=>{
 const f=await fixture({ticketHandler:sequence(network,ok),statusHandler:error(401)});await f.api.s();
 assert.deepEqual(f.tokens,[false,true]);assert.equal(f.count('/garmin/status'),1);assert.equal(f.redirects.length,1);
 assert.equal(f.calls[1].options.headers.Authorization,'Bearer fixture-old-token');
});
for(const hidden of [false,true])test(`permanent ${hidden?'CORS-hidden':'readable'} 401 stops after one refresh`,async()=>{
 const f=await fixture({ticketHandler:hidden?network:error(401),statusHandler:error(401)});
 await rejected(f.api.s(),'auth',401);assert.deepEqual(f.tokens,[false,true]);assert.equal(f.count('/api/auth/ticket'),2);assert.equal(f.redirects.length,0);
});
for(const probeStatus of [200,403,429,503])test(`network error + status ${probeStatus} is not falsely classified as expired auth`,async()=>{
 const f=await fixture({ticketHandler:network,statusHandler:()=>json({},probeStatus)});await rejected(f.api.s(),'network',0);
 assert.deepEqual(f.tokens,[false]);assert.equal(f.count('/api/auth/ticket'),1);assert.equal(f.redirects.length,0);
});
test('offline error skips the diagnostic request',async()=>{
 const f=await fixture({ticketHandler:network,online:false});await rejected(f.api.s(),'network');assert.equal(f.count('/garmin/status'),0);
});
test('network failure in diagnostic request does not trigger refresh',async()=>{
 const f=await fixture({ticketHandler:network,statusHandler:network});await rejected(f.api.s(),'network');assert.deepEqual(f.tokens,[false]);
});
test('diagnostic timeout is bounded to seven seconds',async()=>{
 const f=await fixture({ticketHandler:network,statusHandler:hang});const done=rejected(f.api.s(),'network');await f.tick(7000);await done;
 assert.equal(f.timers.size,0);assert.deepEqual(f.tokens,[false]);
});
for(const[status,kind]of [[403,'forbidden'],[429,'rate_limit'],[500,'server'],[503,'server'],[400,'protocol']])test(`HTTP ${status} preserves status and ${kind} classification`,async()=>{
 const f=await fixture({ticketHandler:error(status)});await rejected(f.api.s(),kind,status);assert.deepEqual(f.tokens,[false]);assert.equal(f.calls.length,1);
});
for(const body of [{},{k:'short'},{k:'x'.repeat(65)},{k:'x'.repeat(31)+'/'},{k:42},null,[]])test(`invalid ticket ${JSON.stringify(body)} never redirects`,async()=>{
 const f=await fixture({ticketHandler:()=>json(body)});await rejected(f.api.s(),'protocol',200);assert.equal(f.redirects.length,0);
});
test('malformed successful JSON reports protocol error',async()=>{
 const f=await fixture({ticketHandler:()=>new Response('{invalid',{status:200})});await rejected(f.api.s(),'protocol',200);
});
test('malformed 401 body still refreshes correctly',async()=>{
 const f=await fixture({ticketHandler:sequence(()=>new Response('{invalid',{status:401}),ok)});await f.api.s();assert.deepEqual(f.tokens,[false,true]);
});
test('a six-second ticket response no longer hits the old five-second cutoff',async()=>{
 let resolve;const f=await fixture({ticketHandler:(_,options)=>new Promise((r,reject)=>{resolve=r;options.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});})});const p=f.api.s();await f.tick(6000);resolve(ok());await p;assert.equal(f.redirects.length,1);
});
test('ticket timeout stops, reports timeout, and clears all timers',async()=>{
 const f=await fixture({ticketHandler:hang});const p=rejected(f.api.s(),'timeout');await f.tick(20000);await p;assert.equal(f.timers.size,0);assert.equal(f.redirects.length,0);
});
test('a stalled token lookup times out without calling ticket API',async()=>{
 const f=await fixture({tokenHandler:()=>new Promise(()=>{})});const p=rejected(f.api.s(),'timeout');await f.tick(10000);await p;assert.equal(f.calls.length,0);assert.equal(f.timers.size,0);
});
test('missing cached token gets one forced refresh',async()=>{
 const f=await fixture({tokenHandler:force=>force?'fresh':null});await f.api.s();assert.deepEqual(f.tokens,[false,true]);assert.equal(f.calls.length,1);
});
test('failed refresh after a rejected token asks for sign-in',async()=>{
 const f=await fixture({ticketHandler:error(401),tokenHandler:force=>force?null:'old'});await rejected(f.api.s(),'auth',401);assert.deepEqual(f.tokens,[false,true]);
});
test('signed-out user makes no HTTP request',async()=>{
 const f=await fixture({session:false,tokenHandler:()=>null});await rejected(f.api.s(),'auth',401);assert.equal(f.calls.length,0);
});
test('shared in-flight promise prevents duplicate tickets',async()=>{
 const f=await fixture();const first=f.api.s(),second=f.api.s();assert.equal(first,second);await Promise.all([first,second]);assert.equal(f.calls.length,1);assert.equal(f.redirects.length,1);
});
test('failed attempt releases single-flight state for manual retry',async()=>{
 const f=await fixture({ticketHandler:sequence(error(503),ok)});await rejected(f.api.s(),'server',503);await f.api.s();assert.equal(f.redirects.length,1);assert.equal(f.calls.length,2);
});
test('account switch during ticket response prevents wrong-account redirect',async()=>{
 let resolve;const f=await fixture({ticketHandler:()=>new Promise(r=>{resolve=r;})});const p=f.api.s();const done=assert.rejects(p,e=>e.code==='account_changed');await flush();f.state.user={uid:'another-fixture-owner'};resolve(ok());await done;assert.equal(f.redirects.length,0);
});
test('abort before connecting makes no HTTP request',async()=>{
 const controller=new AbortController();controller.abort();const f=await fixture();await rejected(f.api.s({signal:controller.signal}),'cancelled');assert.equal(f.calls.length,0);
});
test('abort during ticket request prevents redirect and clears timers',async()=>{
 const controller=new AbortController(),f=await fixture({ticketHandler:hang});const p=rejected(f.api.s({signal:controller.signal}),'cancelled');await flush();controller.abort();await p;assert.equal(f.redirects.length,0);assert.equal(f.timers.size,0);
});
test('whole flow cannot exceed thirty seconds across diagnosis and refresh',async()=>{
 let resolveTicket,resolveStatus,resolveToken;let ticketCalls=0;
 const f=await fixture({ticketHandler:(url,options)=>++ticketCalls===1?new Promise((_,reject)=>{resolveTicket=()=>reject(new TypeError('CORS'));}):hang(url,options),
  statusHandler:()=>new Promise(resolve=>{resolveStatus=()=>resolve(json({},401));}),
  tokenHandler:force=>force?new Promise(resolve=>{resolveToken=()=>resolve('new');}):'old'});
 const p=rejected(f.api.s(),'timeout');await f.tick(18000);resolveTicket();await flush();await f.tick(5000);resolveStatus();await flush();await f.tick(3000);resolveToken();await flush();await f.tick(4000);await p;
 assert.equal(f.redirects.length,0);assert.equal(f.timers.size,0);
});
test('shared ticket helper preserves other integrations and suffixes without token URLs',async()=>{
 const f=await fixture();const url=await f.auth.a('/strava/auth','synthetic-secret','&scope=activity');assert.equal(url,`https://proxy.invalid/strava/auth?k=${ticket}&scope=activity`);assert.ok(!url.includes('synthetic-secret'));
});
for(const language of ['en','de'])test(`${language} auth and network errors are translated`,async()=>{
 const f=await fixture({language,ticketHandler:error(401)});await assert.rejects(f.api.s(),e=>language==='en'?e.message.includes('sign in again'):e.message.includes('erneut anmelden'));
});
test('untrusted server error text is not shown to user',async()=>{
 const f=await fixture({ticketHandler:()=>json({error:'secret=DO_NOT_DISPLAY'},403)});await assert.rejects(f.api.s(),e=>!e.message.includes('DO_NOT_DISPLAY')&&e.code===null);
});
