// Integration smoke test: real shipped React modules + isolated jsdom and
// fake IndexedDB. No network, production account, paid API or external writes.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {qaApp} from './active-graph.mjs';
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
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){for(let i=0;i<600;i++){if(fn())return;await wait(10);}throw Error(label+' timed out: '+w.document.body.textContent.slice(0,350));}

const checks=[];
async function check(name,fn){try{await fn();checks.push({name,ok:true});console.log('PASS',name);}catch(error){checks.push({name,ok:false,error:String(error)});console.error('FAIL',name,error.message);}}
try{
  const app=await qaApp();   // (3.76.23, QA-004) aktivni start iz index.html + stabilen testni vstop (ne stisnjena imena ene gradnje)
  const profile={...app.getState().profile,onboardingDone:true,name:'QA',age:30,heightCm:180,weightKg:80,sex:'m'};
  await app.updateProfile(profile);
  // Start through the real landing-page bootstrap, which removes its own
  // hash listener. Calling the exported start() directly leaves that listener
  // armed and creates a second React root on the first route change.
  w.dispatchEvent(new w.HashChangeEvent("hashchange"));
  await until(()=>w.document.querySelector('main[data-scr="danes"] h1'),'startup');
  const today=app.getState().today;
  const day={id:'qa-strength',date:today,kind:'moc',title:'QA strength',desc:'Ogrevanje in vaje.',durationMin:44,exercises:[{name:'Počep',sets:3,reps:'8–12'},{name:'Sklece',sets:3,reps:'8–12'}],done:{activityId:'qa-partial'}};
  const act={id:'qa-partial',date:today,start:today+'T00:30:00',sport:'moc',name:'QA strength',durationMin:8,exercises:[{name:'Počep',sets:1,reps:'8'}]};
  const meals=[{id:'qa-meal',date:today,slot:'drugo',time:'01:00',name:'banana',kcal:88,proteinG:1,carbsG:20,fatG:0}];
  app.setState({profile,plan:[day],activities:[act],mealsToday:meals,recentMeals:meals});
  await wait(80);
  const settings=app.getState().settings,target=app.dailyTarget(profile,[act],[day],today,{today,hour:1});
  const input={p:profile,target,plan:[day],activities:[act],meals,recentMeals:meals,weather:{},today,hour:1,settings};
  await check('Today and Nutrition recommend the same next recipe',()=>{
    const built=app.dayMealsOf({...input,day:today,prefs:settings.foodPrefs});
    const slot=app.nextSlotOf(built.dp,meals,1);
    const recipes=app.recipesOf(built.dp,today,app.recipeCtxOf(profile,target,settings,built.training,settings.recipeAlt?.[today]||{}),settings);
    const actual=app.nextMealOf(input);
    assert.equal(actual?.slot.key,slot?.key);
    assert.equal(actual?.r.name,recipes[slot.key].name);
    assert.equal(actual?.r.kcal,recipes[slot.key].kcal);
  });
  await check('Partial strength day is not announced or drawn as completed',()=>{
    const button=[...w.document.querySelectorAll('[data-t="teden-dan"]')].find(x=>x.textContent.includes('danes'));
    assert.ok(button,'today button');assert.match(button.getAttribute('aria-label'),/delno/);
    assert.doesNotMatch(button.getAttribute('aria-label'),/opravljeno/);
    assert.equal(button.querySelector('.day-ok'),null);
  });
  await check('Resume partial workout precedes the exercise list',()=>{
    const hero=w.document.querySelector('.sess.spot');
    const button=hero.querySelector('[data-t="nadaljuj-delno"]');
    assert.ok(button,'primary resume button');
    assert.ok(button.compareDocumentPosition(hero.querySelector('.ex-grid')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
  });
  const route=async name=>{app.navigate(name);await until(()=>w.document.querySelector('main[data-scr="'+name+'"] h1'),name);await wait(40);};
  await route('prehrana');
  const fill=value=>{const el=w.document.querySelector('#meal-desc');Object.getOwnPropertyDescriptor(w.HTMLTextAreaElement.prototype,'value').set.call(el,value);el.dispatchEvent(new w.Event('input',{bubbles:true}));};
  fill('200 g jogurta');await wait(20);
  await route('danes');await route('prehrana');
  await check('Unsubmitted food text survives changing tabs',()=>assert.equal(w.document.querySelector('#meal-desc').value,'200 g jogurta'));
  await check('Meal slot shortcuts expose button semantics',()=>assert.ok([...w.document.querySelectorAll('.slot-strip button')].every(el=>el.getAttribute('role')!=='listitem')));
  await check('Nutrition also marks a partial workout as partial',()=>{
    const link=[...w.document.querySelectorAll('button')].find(el=>el.getAttribute('aria-label')?.startsWith('Trening tega dne v Planu:'));
    assert.match(link.textContent,/delno/);assert.doesNotMatch(link.textContent,/✓/);
  });
  const button=text=>[...w.document.querySelectorAll('button')].find(el=>el.textContent.trim()===text);
  await check('Switching dates keeps separate food drafts',async()=>{
    button('prejšnji').click();await until(()=>w.document.querySelector('#meal-desc')?.value==='','previous day empty draft');
    fill('včeraj 100 g riža');await wait(30);
    button('naslednji').click();await until(()=>w.document.querySelector('#meal-desc')?.value==='200 g jogurta','today draft restored');
  });
  await check('Canceling the preview keeps the draft; saving clears it',async()=>{
    fill('100 g banana');await wait(20);
    button('Oceni (tabela živil)').click();await until(()=>w.document.querySelector('#meal-name'),'meal preview');
    button('Prekliči').click();await until(()=>!w.document.querySelector('#meal-name'),'preview canceled');
    assert.equal(w.document.querySelector('#meal-desc').value,'100 g banana');
    button('Oceni (tabela živil)').click();await until(()=>w.document.querySelector('#meal-name'),'meal preview again');
    button('Shrani').click();await until(()=>!w.document.querySelector('#meal-name'),'meal saved');
    await until(()=>w.document.querySelector('#meal-desc')?.value==='','draft cleared');
    await route('danes');await route('prehrana');
    assert.equal(w.document.querySelector('#meal-desc').value,'');
    button('prejšnji').click();await until(()=>w.document.querySelector('#meal-desc')?.value==='včeraj 100 g riža','other draft retained');
  });
  await check('Fully completed training still has a completion tick',async()=>{
    app.setState({plan:[day],activities:[{...act,exercises:day.exercises.map(x=>({...x}))}]});
    await route('danes');
    const todayButton=[...w.document.querySelectorAll('[data-t="teden-dan"]')].find(x=>x.textContent.includes('danes'));
    assert.match(todayButton.getAttribute('aria-label'),/opravljeno/);
    assert.ok(todayButton.querySelector('.day-ok'));
    assert.equal(w.document.querySelector('[data-t="nadaljuj-delno"]'),null);
  });
  assert.equal(errors.length,0,errors.join('\n'));
  console.log(JSON.stringify({checks,runtimeErrors:errors},null,2));
  w.close();process.exit(checks.some(c=>!c.ok)?1:0);
}catch(error){console.error(error);w.close();process.exit(1);}
