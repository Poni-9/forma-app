// Reproducible patch for the exact public 3.76.18 distribution. Port the same
// changes to the private source project before its next build. Never apply this
// script to an unrecognised build: every edit below verifies its input.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(process.argv[2] || dirname(fileURLToPath(import.meta.url))+'/..');
const changed=new Set(),staged=new Map();
const read=p=>staged.get(p)??readFileSync(resolve(root,p),'utf8');
const write=(p,s)=>{staged.set(p,s);changed.add(p);};
function replace(s,from,to,label){const count=s.split(from).length-1;if(count!==1)throw Error(`${label}: expected one match, found ${count}`);return s.replace(from,to);}
const entry='assets/index-B0oLxdFS.js',start='assets/start-VKBk-233.js',pager='assets/pager-DRw6OTJS.js';
if(!read(entry).includes('ct="3.76.18"'))throw Error('This patch requires unmodified version 3.76.18');

// Install the small pager module as part of startup, rather than losing the
// first touch while a dynamic import is pending. The pager only reads imported
// start-module bindings inside installPager, after module evaluation completes.
let main=read(start);
const loaderStart=main.indexOf('function VO('),loaderEnd=main.indexOf('class at extends',loaderStart);
if(loaderStart<0||loaderEnd<0)throw Error('Missing original lazy pager loader');
main='import{installPager as __formaiInstallPager}from"./pager-DRw6OTJS.js";'+main.slice(0,loaderStart)+
  'function VO(e,t,a){return __formaiInstallPager(e,t,a)}'+main.slice(loaderEnd);
write(start,main);

let code=read(pager);
code=replace(code,'const b=new Map;let c=null;','const b=new Map;let c=null;'+`
  // Preserve navigation intent during a settling animation; never replay touch
  // events against a different DOM. Only the requested destination is queued.
  let queuedRoute=null, queuedTouch=null, snapshotNode=null, snapshotDirty=true;
  const invalidateSnapshot=()=>{snapshotDirty=true;A()};
  function flushNavigation(){
    if(E||y||O||queuedTouch||!queuedRoute)return;
    const next=queuedRoute;queuedRoute=null;
    if(next!==o())requestNavigation(next);
  }
  function rememberQueuedTouch(event){
    queuedTouch=null;
    if(event.touches.length!==1||innerWidth>=900||!s.includes(a||o())||
       document.querySelector('.sheet, [aria-modal="true"]'))return;
    const point=event.touches[0];
    if(point.clientX<re||point.clientX>innerWidth-re||ye(event.target))return;
    queuedTouch={x:point.clientX,y:point.clientY,time:Date.now(),route:a||o()};
  }
  function finishQueuedTouch(event){
    const start=queuedTouch;queuedTouch=null;
    const point=event.changedTouches[0];
    if(!start||!point||document.querySelector('.sheet, [aria-modal="true"]'))return;
    const dx=point.clientX-start.x,dy=point.clientY-start.y;
    if(ge(dx,dy,Date.now()-start.time)||
       Math.abs(dx)>innerWidth*.32&&Math.abs(dx)>Math.abs(dy)*ve){
      const next=C(s,queuedRoute||start.route,dx);
      if(next){queuedRoute=next;ae(next);}
    }
    flushNavigation();
  }
`,'navigation state');

// Idle snapshots are invalidated by actual content changes. Observing the app
// excludes the detached preview overlays, and does not observe transform/style
// writes from the gesture itself. Capture never runs while dragging/settling.
code=replace(code,'for(const[i,r]of t){if(!i)continue;',
  'if(snapshotDirty||snapshotNode!==n){U();snapshotNode=n;snapshotDirty=false}for(const[i,r]of t){if(!i)continue;',
  'idle capture');
code=replace(code,'const v=()=>{if(o()!==i)return;U();const $=C(s,e,n);$&&t&&!q()&&I($,n<0?1:-1,t)};',
  '', 'remove capture during settle');
code=replace(code,'X(()=>X(v)),k(T,J+16)','k(T,J+16)','remove double animation frame copy');
code=replace(code,'d=null,U(),T();return','d=null,T();return','no synchronous reduced-motion capture');
code=replace(code,'&&s.includes(e.dataset.scr)&&U(),A())','&&s.includes(e.dataset.scr)&&(snapshotDirty=true),A())','defer hash-change capture');

// Stop blocking on lazy page contents: the real page's loading state is a valid
// destination. Keep waiting only until React has committed the destination main.
code=replace(code,'const T=()=>{if(o()!==i)', 'const T=()=>{if(O)return;if(o()!==i)', 'disposed settle guard');
code=replace(code,'p(e);const $=r?.y??0,',
  'q()||(u.dataset.swipe=n<0?"l":"r"),p(e);const $=r?.y??0,', 'disable entrance animations before route commit');
code=replace(code,'oe=()=>{const P=document.querySelector("main.screen"),K=!!P&&P!==t&&P.firstElementChild?.getAttribute("aria-busy")!=="true";',
  'oe=()=>{if(O)return;if(o()!==e){F(r);c=null;N(t&&t.isConnected?t:null);d=null;E=false;A();flushNavigation();return}const P=document.querySelector("main.screen"),K=!!P&&P!==t&&P.dataset.scr===e;',
  'destination readiness');
code=replace(code,'E=!1,A();const Q=', 'E=!1,A();flushNavigation();const Q=', 'release queued navigation');
code=replace(code,'d=null,N(n),E=!1,A()},r+30)', 'd=null,N(n),E=!1,A(),flushNavigation()},r+30)', 'release queue after snap-back');
code=replace(code,'Z=e=>{if(y&&e.touches.length!==1)',
  'Z=e=>{if(queuedTouch&&e.touches.length!==1){queuedTouch=null;return}if(E){rememberQueuedTouch(e);return}if(y&&e.touches.length!==1)', 'capture touches while settling');
code=replace(code,'const ne=e=>{if(!y)return;',
  'const ne=e=>{if(queuedTouch){finishQueuedTouch(e);return}if(!y)return;', 'complete queued gesture');
code=replace(code,'se=()=>{y&&(y=!1,Y(0))}',
  'se=()=>{queuedTouch=null;y&&(y=!1,Y(0))}', 'cancel queued gesture');
code=replace(code,'ie(e=>{const n=o();if(E||y||O||',
  'function requestNavigation(e){const n=o();if(y||O||', 'named navigation handler');
code=replace(code,'return!1;const t=document.querySelector("main.screen");if(!t)return!1;ae(e);',
  'return!1;if(E){queuedRoute=e;ae(e);return!0}const t=document.querySelector("main.screen");if(!t)return!1;ae(e);', 'queue tab taps');
code=replace(code,'X(()=>te(e,-i)),!0});const ne=',
  'E=true,a=e,X(()=>{O||te(e,-i)}),!0}ie(requestNavigation);const ne=', 'register named navigation');
code=replace(code,'||e===n||!s.includes(n)', '||!s.includes(n)', 'allow returning to the outgoing tab');
code=replace(code,'if(E){queuedRoute=e;ae(e);return!0}const t=',
  'if(E){queuedRoute=e;ae(e);return!0}if(e===n)return!1;const t=', 'same-tab check after queue');
code=replace(code,'return document.addEventListener("touchstart",Z,{passive:!0}),',`
  const snapshotObserver=typeof MutationObserver==='function'?new MutationObserver(invalidateSnapshot):null;
  const appRoot=document.querySelector('.app');
  appRoot&&snapshotObserver?.observe(appRoot,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','aria-busy','value','checked']});
  document.addEventListener('input',invalidateSnapshot,{passive:true});
  document.addEventListener('change',invalidateSnapshot,{passive:true});
  return document.addEventListener("touchstart",Z,{passive:!0}),`, 'snapshot invalidation');
code=replace(code,'()=>{O=!0,ie(null);',
  "()=>{O=!0,ie(null);queuedRoute=null;queuedTouch=null;delete u.dataset.swipe;snapshotObserver?.disconnect();document.removeEventListener('input',invalidateSnapshot);document.removeEventListener('change',invalidateSnapshot);", 'dispose observers');
write(pager,code);

// OAuth must fail closed. A Firebase ID token belongs only in the Authorization
// header of the ticket request, never in a navigation URL, including failures.
let boot=read(entry);
const from=boot.indexOf('async function Et('),to=boot.indexOf('export{',from);
if(from<0||to<0)throw Error('Missing ticket functions');
boot=boot.slice(0,from)+`
async function Et(token){
  const controller=typeof AbortController==='function'?new AbortController():null;
  const timer=controller?setTimeout(()=>controller.abort(),5000):null;
  try{
    const response=await fetch(P+'/api/auth/ticket',{
      method:'POST',headers:{Authorization:'Bearer '+token},cache:'no-store',
      ...(controller?{signal:controller.signal}:{})
    });
    if(!response.ok)return null;
    const body=await response.json();
    return typeof body?.k==='string'&&/^[A-Za-z0-9_-]{32,64}$/.test(body.k)?body.k:null;
  }catch{return null}finally{if(timer!==null)clearTimeout(timer)}
}
async function $t(path,token,extra=''){
  const ticket=await Et(token);
  if(!ticket)throw new Error(g('Strežnik se ne odziva — poskusi znova.'));
  return P+path+'?k='+encodeURIComponent(ticket)+extra;
}
`+boot.slice(to);
boot=replace(boot,'ct="3.76.18"','ct="3.76.19"','version');
write(entry,boot);
const strava='assets/client-D8JJCPky.js';
write(strava,replace(read(strava),'const P=t=>`${c}/strava/auth?t=${encodeURIComponent(t)}`;',
  'const P=t=>S("/strava/auth",t);','legacy Strava URL helper'));
const wahoo='assets/client-BCUDZr0T.js';
write(wahoo,replace(read(wahoo),'return`${c}/wahoo/auth?t=${encodeURIComponent(o)}${n?"&znova=1":""}`',
  'return j("/wahoo/auth",o,n?"&znova=1":"")','legacy Wahoo URL helper'));

// Keep weighed quantities continuous until final nutrition rounding. The old
// minimum of 0.05 pieces turned zero/one gram of banana into six grams.
const actions='assets/actions-DQA3mpOX.js';let food=read(actions);
food=replace(food,'Math.max(.05,g/(a.piece||100))','g/(a.piece||100)','remove minimum fruit mass');
food=replace(food,'Math.round(ge(c,l)*100)/100','ge(c,l)','trailing mass precision');
food=replace(food,'Math.round(ge(O[2],l)*100)/100','ge(O[2],l)','piece precision');
food=replace(food,'Math.round(ge(O?d.slice(0,O.index+O[1].length):d,b)*j*100)/100',
  'ge(O?d.slice(0,O.index+O[1].length):d,b)*j','food quantity precision');
food=replace(food,'function To(e){',
  'const __formaiMass=e=>/(?:^|\\s)(?:g|kg|dag|gram\\p{L}*|kilogram\\p{L}*|dekagram\\p{L}*)(?!\\p{L})/u.test(e);function To(e){','explicit mass detection');
food=replace(food,'r=(k,p,j)=>{const c=ce[k.key]',
  'r=(k,p,j,explicitMass=false)=>{const c=ce[k.key]','mass label argument');
food=replace(food,'k.piece&&Math.abs(p*2-Math.round(p*2))>.01?',
  'k.piece&&(explicitMass||Math.abs(p*2-Math.round(p*2))>.01)?','mass label selection');
food=replace(food,'r(l,h,oe.test(c))','r(l,h,oe.test(c),__formaiMass(c))','trailing mass label');
food=replace(food,'i.push(r(b,A,S))','i.push(r(b,A,S,__formaiMass(d)))','mass label');
write(actions,food);

// Workbox revision changes cause a real cache refresh, even though this precise
// distribution patch preserves the existing internal module filenames.
let sw=read('sw.js');
for(const path of changed){
  const hash=createHash('md5').update(read(path)).digest('hex');
  const escaped=path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp('(url:"'+escaped+'",revision:)(?:null|"[^"]+")(})');
  if(!re.test(sw))throw Error('Missing precache record: '+path);
  sw=sw.replace(re,'$1"'+hash+'"$2');
}
write('sw.js',sw);
for(const [path,content] of staged)writeFileSync(resolve(root,path),content);
mkdirSync(resolve(root,'hotfix'),{recursive:true});
writeFileSync(resolve(root,'hotfix/changed-files.json'),JSON.stringify([...changed],null,2)+'\n');
console.log(JSON.stringify({version:'3.76.19',changed:[...changed]},null,2));
