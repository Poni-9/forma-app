// Reproducible distribution patch from the pinned 3.76.49 base.
// Run once from any directory. Refuses a modified or different base.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const write=(p,s)=>writeFileSync(new URL(p,root),s);
const source=p=>read('hotfix/source/3.76.50/'+p);
if(read('VERSION.txt').trim()==='3.76.50') { console.log('3.76.50 already applied; run tests.'); process.exit(0); }
const hashes=JSON.parse(source('base-hashes.json'));
for(const [p,expected] of Object.entries(hashes)) {
 const actual=createHash('sha256').update(readFileSync(new URL(p,root))).digest('hex');
 if(actual!==expected)throw Error('Unexpected base: '+p);
}
const changes=new Map();
function replace(p,from,to) {
 const s=changes.get(p)??read(p);
 if(s.split(from).length!==2)throw Error('Expected one patch target: '+p+' '+from.slice(0,90));
 changes.set(p,s.replace(from,to));
}
const client='assets/client-fBuPiPXI.js',store='assets/garminStore-DhdQHIDj.js';
const start='assets/start-DrVvX_cP.js',card='assets/WahooCard-lbwEVQhn.js';
const consent='assets/GarminConsentSheet-BJHuA7rW.js';
changes.set('assets/authTicket-D8aGz4yR.js',source('auth-ticket.js'));
changes.set('assets/garminAuthRecovery-37650.js',source('garmin-auth-recovery.js'));
replace(client,'import{af as l,b as w,aW as f}', 'import{af as l,b as w,aW as f,D as authState}');
replace(client,'class a extends Error','import{createGarminAuthFlow}from"./garminAuthRecovery-37650.js";class a extends Error');
const original=read(client).match(/async function P\(\)\{.*?\}\)\}\s*function _\(/)?.[0];
if(!original)throw Error('Garmin connect function not found');
replace(client,original,'const P=createGarminAuthFlow({getToken:l,hasSession:w,getOwner:()=>authState.user?.uid??null,authUrl:g,proxy:p,ErrorType:a,t:r,navigate:url=>{location.href=url}});function _(');
replace(store,'async function nn(e){Ge(e);try{await st()}catch(t){Ge(void 0),m(J(t),"err",8e3)}}',
 'let connectPending=null;function nn(e,t){if(connectPending)return connectPending;Ge(e);v({garminErr:null});connectPending=(async()=>{try{await st(t);return!0}catch(t){Ge(void 0);v({garminErr:J(t)});m(J(t),"err",8e3);return!1}finally{connectPending=null}})();return connectPending}');
replace(start,'const cD=e=>An(t=>t.connectGarmin(e),void 0)', 'const cD=(e,t)=>An(a=>a.connectGarmin(e,t),!1)');
// Do not hold a dead button for an arbitrary 20 seconds after a failed request.
replace(card,'onClick:()=>{V(),s("go"),window.setTimeout(()=>s(p=>p==="go"?null:p),2e4),W()}',
 'onClick:async()=>{V();s("go");try{await W()}finally{s(null)}}');
replace(card,'const[c,s]=k.useState(null),[m,y]=k.useState(null);',
 'const[c,s]=k.useState(null),[m,y]=k.useState(null),[connectChoice,setConnectChoice]=k.useState(null);k.useEffect(()=>{setConnectChoice(null)},[i.user?.uid]);');
replace(card,'function ae({mode:r,onClose:i,onDone:n})', 'function ae({mode:r,onClose:i,onDone:n,initialChoice:choice,error:failure})');
replace(card,'mode:r,onClose:i,onDone:n})})})', 'mode:r,onClose:i,onDone:n,initialChoice:choice,error:failure})})})');
replace(card,'i.user?a.jsx(f,{primary:!0,block:!0,style:{marginTop:12}', 'i.user&&!h?a.jsx(f,{primary:!0,block:!0,style:{marginTop:12}');
replace(card,'children:e("Prijavi se, da povežeš Garmin")', 'children:i.user?e("Prijavi se znova"):e("Prijavi se, da povežeš Garmin")');
replace(card,'/prijava je potekla|prijavi se/i', '/prijava je potekla|prijavi se|session has expired|sign in again|sitzung ist abgelaufen|erneut anmelden/i');
replace(card,'a.jsx(ae,{mode:m,onClose:()=>y(null),onDone:p=>{y(null),s("go"),window.setTimeout(()=>s(z=>z==="go"?null:z),2e4),W(p)}})',
 'a.jsx(ae,{mode:m,initialChoice:connectChoice,error:i.garminErr,onClose:()=>y(null),onDone:async p=>{setConnectChoice(p);y(null);s("go");try{await W(p)}finally{s(null)}}})');
replace(consent,'function f({mode:a,onClose:t,onDone:o,open:s=!0}){const[i,l]=j.useState(!1),[c,v]=j.useState(!1)',
 'function f({mode:a,onClose:t,onDone:o,open:s=!0,initialChoice:choice,error:failure}){const[i,l]=j.useState(choice?.upload===!0),[c,v]=j.useState(choice?.ai===!0)');
replace(consent,'n.jsx(d,{primary:!0,block:!0,style:{marginTop:14}',
 'failure&&n.jsx("p",{role:"alert",style:{marginTop:12,color:"var(--warn)"},children:failure}),n.jsx(d,{primary:!0,block:!0,style:{marginTop:14}');
replace('assets/index-kbgVKkft.js','"3.76.49"','"3.76.50"');
changes.set('VERSION.txt','3.76.50\n');
const translations=JSON.parse(source('translations.json'));
changes.set('assets/authMessages-37650.js','export const messages='+JSON.stringify(translations)+';\n');
replace('assets/index-kbgVKkft.js','const __vite__mapDeps=', 'import{messages as authMessages}from"./authMessages-37650.js";const __vite__mapDeps=');
replace('assets/index-kbgVKkft.js','return Q(n||t,e)', 'return Q(n||authMessages[m]?.[t]||t,e)');
// Changed files retain their import identities; Workbox revisions invalidate
// old cached bytes without touching any user database or authentication data.
let sw=read('sw.js');
for(const [p,s]of changes)if(p.startsWith('assets/')) {
 const revision=createHash('md5').update(s).digest('hex');
 const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const re=new RegExp('\\{url:"'+escaped+'",revision:(null|"[0-9a-f]+")\\}');
 if(re.test(sw))sw=sw.replace(re,`{url:"${p}",revision:"${revision}"}`);
 else {
  if(!['assets/garminAuthRecovery-37650.js','assets/authMessages-37650.js'].includes(p))throw Error('Missing cache entry: '+p);
  sw=sw.replace('{url:"assets/client-fBuPiPXI.js"',`{url:"${p}",revision:"${revision}"},{url:"assets/client-fBuPiPXI.js"`);
 }
}
changes.set('sw.js',sw);
// All targets and hashes have been checked before writing any application file.
for(const [p,s]of changes)write(p,s);
console.log('Applied 3.76.50 to '+changes.size+' files. Run npm test, test:app and test:journeys from tests/.');
