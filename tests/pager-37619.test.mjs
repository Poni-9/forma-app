import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(process.env.FORMAI_TEST_MODULES || import.meta.url);
const {JSDOM}=require('jsdom');
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const startCode=read('assets/start-VKBk-233.js');
const helpers=startCode.slice(startCode.indexOf('const KO=64,'),startCode.indexOf('let ly=null,cy=null;'));
const loader=startCode.slice(startCode.indexOf('function VO('),startCode.indexOf('class at extends',startCode.indexOf('function VO(')));
const pager=read('assets/pager-DRw6OTJS.js').replace(/import[^;]+;/g,'').replace(/export\{[^;]+;/g,'');
const routes=['danes','plan','prehrana','trener','aktivnosti'];

function fixture({reduced=false,renderDelay=0,lazy=false}={}) {
  const dom=new JSDOM('<!doctype html><html><body><div class="app"><main class="screen" data-scr="danes"><header>Danes</header><div><input></div></main><nav class="tabs"><i class="tab-ind"></i>'+routes.map(r=>`<button class="tab" data-t="zavihek-${r}">${r}</button>`).join('')+'</nav></div></body></html>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://test.invalid/'});
  const w=dom.window,d=w.document;let now=1000,id=0,current='danes';const jobs=new Map(),events=[];
  w.setTimeout=(fn,ms=0)=>{jobs.set(++id,{at:now+ms,fn});return id;};w.clearTimeout=id=>jobs.delete(id);
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(now),16);w.cancelAnimationFrame=w.clearTimeout;
  w.requestIdleCallback=fn=>w.setTimeout(fn,300);w.cancelIdleCallback=w.clearTimeout;
  w.Date.now=()=>now;w.scrollTo=()=>{};w.matchMedia=()=>({matches:reduced});w.ontouchstart=null;
  Object.defineProperty(w,'innerWidth',{value:390});
  const tick=ms=>{const until=now+ms;let count=0;for(;;){const job=[...jobs].filter(([,x])=>x.at<=until).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!job)break;if(++count>10000)throw Error('timer loop');now=job[1].at;jobs.delete(job[0]);job[1].fn();}now=until;};
  const replace=(route,busy=false)=>{const el=d.createElement('main');el.className='screen';el.dataset.scr=route;el.innerHTML=busy?'<div aria-busy="true"></div>':`<header>${route}</header><div><input></div>`;d.querySelector('main').replaceWith(el);};
  const render=route=>{current=route;events.push({type:'route',route,time:now,swipe:d.documentElement.dataset.swipe});replace(route,renderDelay>0);w.dispatchEvent(new w.Event('hashchange'));if(renderDelay)w.setTimeout(()=>{if(current===route){replace(route);events.push({type:'ready',time:now});}},renderDelay);};
  w.eval(helpers+'\nlet handler;const ie=fn=>{handler=fn},re=M8,ye=T8,C=S8,ge=x8,ve=FO,Me={},ae=()=>{};\n'+pager+'\nwindow.api={install:Ne,capture:U,tap:e=>handler?.(e),clear:Ae};');
  let resolveLoad,dispose;
  if(lazy){w.load=new Promise(r=>resolveLoad=r);w.eval('const __formaiInstallPager=window.api.install;'+loader+';window.lazyInstall=VO;');dispose=w.lazyInstall(routes,()=>current,render);}else dispose=w.api.install(routes,()=>current,render);
  const touch=(type,points,changed=points,target=d.querySelector('main'))=>{const e=new w.Event(type,{bubbles:true});const pts=arr=>arr.map(([clientX,clientY])=>({clientX,clientY}));Object.defineProperties(e,{touches:{value:pts(points)},changedTouches:{value:pts(changed)}});target.dispatchEvent(e);};
  const start=(x=195,y=210,target)=>touch('touchstart',[[x,y]],undefined,target);
  const move=(dx,dy=0)=>touch('touchmove',[[195+dx,210+dy]]);
  const end=(dx,dy=0,cancel=false)=>touch(cancel?'touchcancel':'touchend',[],[[195+dx,210+dy]]);
  const swipe=(dx,dy=0)=>{start();tick(30);move(dx*.3,dy*.3);tick(40);move(dx,dy);tick(100);end(dx,dy);};
  return {w,d,tick,events,render,tap:route=>w.api.tap(route),dispose:()=>dispose(),start,move,end,touch,swipe,now:()=>now,current:()=>current,transform:()=>d.querySelector('main').style.transform,load:async()=>{resolveLoad({installPager:w.api.install});await Promise.resolve();await Promise.resolve();},close:()=>{dispose();jobs.clear();w.close();}};
}

test('3.76.19: all four adjacent pairs in both directions',()=>{
  const f=fixture();try{for(const route of routes.slice(1)){f.swipe(-155);f.tick(700);assert.equal(f.current(),route);assert.equal(f.transform(),'');}for(const route of routes.slice(0,-1).reverse()){f.swipe(155);f.tick(700);assert.equal(f.current(),route);assert.equal(f.transform(),'');}}finally{f.close();}
});
test('3.76.19: bounds, vertical movement, short gesture and touchcancel',()=>{
  const f=fixture();try{f.swipe(155);f.tick(700);assert.equal(f.current(),'danes');f.render('aktivnosti');f.swipe(-155);f.tick(700);assert.equal(f.current(),'aktivnosti');f.render('plan');for(const [dx,dy] of [[-20,150],[-18,0]]){f.swipe(dx,dy);f.tick(700);assert.equal(f.current(),'plan');assert.equal(f.transform(),'');}f.start();f.move(-110);f.end(-110,0,true);f.tick(700);assert.equal(f.current(),'plan');assert.equal(f.transform(),'');}finally{f.close();}
});
test('3.76.19: second finger cancels and next gesture works',()=>{
  const f=fixture();try{f.start();f.move(-110);f.touch('touchstart',[[85,210],[95,230]]);f.tick(700);assert.equal(f.current(),'danes');assert.equal(f.transform(),'');f.swipe(-155);f.tick(700);assert.equal(f.current(),'plan');}finally{f.close();}
});
test('3.76.19: input and modal exclusions',()=>{
  const f=fixture();try{f.start(195,210,f.d.querySelector('input'));f.move(-155);f.end(-155);f.tick(700);assert.equal(f.current(),'danes');const modal=f.d.createElement('div');modal.className='sheet';f.d.body.append(modal);f.swipe(-155);f.tick(700);assert.equal(f.current(),'danes');}finally{f.close();}
});
test('3.76.19: reduced motion switches without animated translation',()=>{
  const f=fixture({reduced:true});try{f.swipe(-155);f.tick(30);assert.equal(f.current(),'plan');assert.equal(f.transform(),'');}finally{f.close();}
});

test('3.76.19: first gesture works immediately after startup',()=>{
  const f=fixture({lazy:true});try{f.swipe(-155);f.tick(700);assert.equal(f.current(),'plan');}finally{f.close();}
});
test('3.76.19: a second gesture during settle is preserved',()=>{
  const f=fixture();try{f.swipe(-155);f.swipe(-155);f.tick(1000);assert.equal(f.current(),'prehrana');assert.equal(f.transform(),'');}finally{f.close();}
});
test('3.76.19: pending gesture can finish after the previous transition',()=>{
  const f=fixture();try{f.swipe(-155);f.tick(290);f.start();f.tick(150);f.move(-155);f.end(-155);f.tick(900);assert.equal(f.current(),'prehrana');}finally{f.close();}
});
test('3.76.19: destination loading does not block further navigation',()=>{
  const f=fixture({renderDelay:1200});try{f.swipe(-155);f.tick(400);assert.equal(f.current(),'plan');f.swipe(-155);f.tick(400);assert.equal(f.current(),'prehrana');f.tick(1500);assert.equal(f.d.querySelector('main').dataset.scr,'prehrana');assert.equal(f.transform(),'');}finally{f.close();}
});
test('3.76.19: no outgoing DOM copy during a gesture or its settle animation',()=>{
  const f=fixture();try{let copies=0;const orig=f.w.Node.prototype.cloneNode;f.w.Node.prototype.cloneNode=function(...args){copies++;return orig.apply(this,args);};f.swipe(-155);f.tick(330);assert.equal(copies,0);f.tick(800);assert.ok(copies>0,'snapshot is prepared during idle instead');}finally{f.close();}
});
test('3.76.19: entrance-animation suppression is set before rendering',()=>{
  const f=fixture();try{f.swipe(-155);f.tick(400);assert.equal(f.events[0].swipe,'l');}finally{f.close();}
});
test('3.76.19: rapid tab taps preserve the final destination, including back to original',()=>{
  for(const final of ['trener','danes']){const f=fixture();try{assert.equal(f.tap('plan'),true);assert.equal(f.tap(final),true);f.tick(1500);assert.equal(f.current(),final);assert.equal(f.transform(),'');}finally{f.close();}}
});
test('3.76.19: cancellation and second finger also cancel a queued gesture',()=>{
  for(const cancel of ['touchcancel','second']){const f=fixture();try{f.swipe(-155);f.start();f.move(-155);if(cancel==='second')f.touch('touchstart',[[40,210],[60,220]]);else f.end(-155,0,true);f.end(-155);f.tick(1000);assert.equal(f.current(),'plan');}finally{f.close();}}
});
test('3.76.19: disposal cancels pending navigation and cleans translated elements',()=>{
  const f=fixture();try{f.tap('plan');f.dispose();f.tick(1000);assert.equal(f.current(),'danes');assert.equal(f.transform(),'');assert.equal(f.d.querySelectorAll('.swipe-peek').length,0);assert.equal(f.d.documentElement.dataset.swipe,undefined);}finally{f.close();}
});
test('3.76.19: external navigation during a transition is respected',()=>{
  const f=fixture();try{f.swipe(-155);f.tick(100);f.render('nastavitve');f.tick(1000);assert.equal(f.current(),'nastavitve');assert.equal(f.transform(),'');}finally{f.close();}
});
