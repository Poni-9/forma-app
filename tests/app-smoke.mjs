// Integration smoke test: real shipped React modules + isolated jsdom and
// fake IndexedDB. No network, production account, paid API or external writes.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(process.env.FORMAI_TEST_MODULES || import.meta.url);
const {JSDOM}=require('jsdom'),idb=require('fake-indexeddb');
const dom=new JSDOM('<!doctype html><html class="is-land"><head><meta name="theme-color"></head><body><div id="root"></div></body></html>',{url:'https://test.invalid/#/danes',pretendToBeVisual:true});
const w=dom.window,errors=[],navigation=[];
w.addEventListener('hashchange',()=>navigation.push({hash:w.location.hash,state:w.history.state,length:w.history.length}));
w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
w.requestIdleCallback=fn=>w.setTimeout(()=>fn({didTimeout:false,timeRemaining:()=>50}),50);w.cancelIdleCallback=w.clearTimeout;
w.fetch=async url=>{if(new URL(String(url),w.location.href).pathname.startsWith('/assets/'))return new Response('',{status:200});throw new TypeError('Offline integration fixture');};
w.localStorage.setItem('formai.lang','sl');w.localStorage.setItem('formai.statsOff','1');
Object.defineProperty(w,'innerWidth',{value:390});w.ontouchstart=null;
for(const key of ['window','document','navigator','location','history','localStorage','sessionStorage','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLButtonElement','Element','Node','MutationObserver','Event','CustomEvent','HashChangeEvent','DOMException','getComputedStyle','matchMedia','fetch','requestAnimationFrame','cancelAnimationFrame','requestIdleCallback','cancelIdleCallback','addEventListener','removeEventListener','dispatchEvent']){
  const value=key==='window'?w:w[key];Object.defineProperty(globalThis,key,{value:typeof value==='function'&&/^(getComputedStyle|matchMedia|fetch|request|cancel|addEvent|removeEvent|dispatchEvent)/.test(key)?value.bind(w):value,configurable:true});
}
globalThis.innerWidth=390;globalThis.scrollY=0;
for(const [key,value] of Object.entries(idb))if(key==='indexedDB'||key.startsWith('IDB')){globalThis[key]=value;Object.defineProperty(w,key,{value,configurable:true});}
new w.MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeName==='LINK')queueMicrotask(()=>node.dispatchEvent(new w.Event('load')));}}).observe(w.document.head,{childList:true});
w.addEventListener('error',event=>errors.push(String(event.error||event.message)));
process.on('unhandledRejection',error=>errors.push(String(error)));
let backCalls=0;
const historyBack=w.history.back.bind(w.history);
w.history.back=()=>{backCalls++;return historyBack();};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){for(let i=0;i<600;i++){if(fn())return;await wait(10);}throw Error(label+' timed out: '+w.document.body.textContent.slice(0,350));}
try{
  const app=await import('../assets/start-VKBk-233.js');
  await app.cE({...app.g().profile,onboardingDone:true,name:'Preizkus',age:30,heightCm:180,weightKg:80});
  // Start through the real landing-page bootstrap, which removes its own
  // hash listener. Calling the exported start() directly leaves that listener
  // armed and creates a second React root on the first route change.
  w.dispatchEvent(new w.HashChangeEvent("hashchange"));
  await until(()=>w.document.querySelector('main[data-scr="danes"]'),'App startup');
  const results=[];
  for(const route of ['danes','plan','prehrana','trener','aktivnosti','napredek','nastavitve','uvoz','vaje']){
    app.n(route);await until(()=>w.document.querySelector(`main[data-scr="${route}"] h1`),route);
    const main=w.document.querySelector('main.screen');
    assert.ok(!main.textContent.includes('Tega dela ni bilo mogoče naložiti'),route);
    results.push({route,heading:main.querySelector('h1').textContent,buttons:main.querySelectorAll('button').length});
  }
  app.n('danes');await until(()=>w.document.querySelector('main[data-scr="danes"] h1'),'swipe start page');
  const touch=(type,x,touching=true)=>{const event=new w.Event(type,{bubbles:true});Object.defineProperties(event,{touches:{value:touching?[{clientX:x,clientY:220}]:[]},changedTouches:{value:[{clientX:x,clientY:220}]}});w.document.querySelector('main').dispatchEvent(event);};
  const swipe=async dx=>{touch('touchstart',195);await wait(30);touch('touchmove',195+dx);await wait(100);touch('touchend',195+dx,false);};
  await swipe(-155);await until(()=>w.document.querySelector('main[data-scr="plan"] h1'),'actual React left swipe');await wait(80);
  await swipe(155);await until(()=>w.document.querySelector('main[data-scr="danes"] h1'),'actual React right swipe');
  await wait(450);assert.equal(w.document.querySelector('main').style.transform,'');
  assert.equal(w.location.hash,'#/danes','return gesture stays on Today');
  assert.equal(backCalls,1,'a single gesture traverses history exactly once');
  const tabs=[...w.document.querySelectorAll('nav.tabs button[data-t]')];
  tabs.find(b=>b.dataset.t==='zavihek-plan').click();tabs.find(b=>b.dataset.t==='zavihek-trener').click();
  await until(()=>w.document.querySelector('main[data-scr="trener"] h1'),'actual React rapid taps');
  await wait(400);assert.equal(w.document.querySelector('main').style.transform,'');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log(JSON.stringify({integration:'real modules; mocked browser/storage; network disabled',routes:results,errors},null,2));
  w.close();process.exit(0);
}catch(error){console.error(error);console.error('Runtime errors:',errors);console.error('Navigation:',navigation);w.close();process.exit(1);}
