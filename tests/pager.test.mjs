import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(process.env.FORMAI_TEST_MODULES || import.meta.url);
const { JSDOM } = require('jsdom');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const start = readFileSync(resolve(root,'assets/start-BRLivjHr.js'),'utf8');
const pager = readFileSync(resolve(root,'assets/pager-Dj7_ZNIM.js'),'utf8').replace(/import[^;]+;/g,'').replace(/export\{[^;]+;/g,'');
const helpers = start.slice(start.indexOf('const KO=64,'), start.indexOf('let ly=null,cy=null;'));
const wait = ms => new Promise(r=>setTimeout(r,ms));

function fixture({ reduced = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div class="app"><main class="screen" data-scr="danes"><h1>Danes</h1><input></main><nav class="tabs"><i class="tab-ind"></i></nav></div></body></html>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://test.invalid/'});
  const w=dom.window,d=w.document;
  Object.defineProperty(w,'innerWidth',{value:390});w.ontouchstart=null;
  w.matchMedia=()=>({matches:reduced});w.scrollTo=()=>{};
  w.eval(helpers+'\nlet handler;const ie=fn=>{handler=fn},re=M8,ye=T8,N=S8,ge=x8,ve=FO,Me={},ae=()=>{};\n'+pager+'\nwindow.testPager={installPager:Ne,clear:Ae,tap:e=>handler?.(e)};');
  const routes=['danes','plan','prehrana','trener','aktivnosti'];
  let current='danes';
  const render=route=>{current=route;const main=d.createElement('main');main.className='screen';main.dataset.scr=route;main.innerHTML='<h1>'+route+'</h1><input>';d.querySelector('main').replaceWith(main);w.dispatchEvent(new w.Event('hashchange'));};
  const dispose=w.testPager.installPager(routes,()=>current,render);
  const touch=(type,points,target=d.querySelector('main'),changed=points)=>{const e=new w.Event(type,{bubbles:true});Object.defineProperties(e,{touches:{value:points.map(([clientX,clientY])=>({clientX,clientY}))},changedTouches:{value:changed.map(([clientX,clientY])=>({clientX,clientY}))}});target.dispatchEvent(e);};
  const begin=(dx,dy=0,target)=>{touch('touchstart',[[195,210]],target);touch('touchmove',[[195+dx,210+dy]],target);};
  const end=async(dx,dy=0,{cancel=false,target}={})=>{await wait(100);touch(cancel?'touchcancel':'touchend',[],target,[[195+dx,210+dy]]);await wait(450);};
  const centered=()=>assert.equal(d.querySelector('main').style.transform,'');
  return {w,d,render,dispose,touch,begin,end,centered,current:()=>current,close:()=>{dispose();w.close();}};
}

test('pager: left/right transitions, boundaries and short/vertical/cancelled gestures',async()=>{
  const f=fixture();try{
    f.begin(-155);await f.end(-155);assert.equal(f.current(),'plan');f.centered();
    f.begin(155);await f.end(155);assert.equal(f.current(),'danes');f.centered();
    f.begin(155);await f.end(155);assert.equal(f.current(),'danes');f.centered();
    f.render('aktivnosti');f.begin(-155);await f.end(-155);assert.equal(f.current(),'aktivnosti');f.centered();
    f.render('plan');f.begin(-18);await f.end(-18);assert.equal(f.current(),'plan');f.centered();
    f.begin(-20,150);await f.end(-20,150);assert.equal(f.current(),'plan');f.centered();
    f.begin(-110);await f.end(-110,0,{cancel:true});assert.equal(f.current(),'plan');f.centered();
  }finally{f.close();}
});
test('pager: a second finger during a drag resets the translated screen',async()=>{
  const f=fixture();try{
    f.render('plan');f.begin(-110);assert.match(f.d.querySelector('main').style.transform,/-110/);
    f.touch('touchstart',[[85,210],[95,230]]);await wait(450);assert.equal(f.current(),'plan');f.centered();
    f.begin(-155);await f.end(-155);assert.equal(f.current(),'prehrana');f.centered();
  }finally{f.close();}
});
test('pager: inputs and modal dialogs block swipes',async()=>{
  const f=fixture();try{
    const input=f.d.querySelector('input');f.begin(-155,0,input);await f.end(-155,0,{target:input});assert.equal(f.current(),'danes');f.centered();
    const modal=f.d.createElement('div');modal.className='sheet';f.d.body.append(modal);f.begin(-155);await f.end(-155);assert.equal(f.current(),'danes');f.centered();
  }finally{f.close();}
});
test('pager: rapid navigation preserves the final target and cleans overlays',async()=>{
  const f=fixture();try{
    assert.equal(f.w.testPager.tap('plan'),true);await wait(80);
    assert.equal(f.w.testPager.tap('trener'),false);f.render('trener');await wait(700);
    assert.equal(f.current(),'trener');f.centered();
    assert.ok([...f.d.querySelectorAll('.swipe-peek')].every(el=>el.hasAttribute('inert')&&el.getAttribute('aria-hidden')==='true'));
  }finally{f.close();}
});
test('pager: disposal during a gesture clears translation and overlays',()=>{
  const f=fixture();try{
    f.begin(-110);f.dispose();f.centered();assert.equal(f.d.querySelectorAll('.swipe-peek').length,0);
  }finally{f.w.close();}
});
test('pager: reduced motion changes routes without animated transforms',async()=>{
  const f=fixture({reduced:true});try{
    assert.equal(f.w.testPager.tap('plan'),false);
    f.begin(-155);await f.end(-155);assert.equal(f.current(),'plan');f.centered();
  }finally{f.close();}
});
