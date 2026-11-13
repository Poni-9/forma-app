// Execute shipped card/store/consent code with isolated state and hook adapters.
// Full DOM navigation coverage remains in app-smoke.mjs and daily-journeys.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';
import {activeGraph} from './active-graph.mjs';
const root=new URL('../',import.meta.url);
const paths=[...activeGraph().modules];
const read=p=>readFileSync(new URL(p,root),'utf8');
const find=prefix=>{const p=paths.find(p=>p.startsWith('assets/'+prefix));assert.ok(p,prefix);return p;};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const plain=v=>JSON.parse(JSON.stringify(v));
const nodes=(value,out=[])=>{if(Array.isArray(value))for(const v of value)nodes(v,out);else if(value&&typeof value==='object'){out.push(value);nodes(value.props?.children,out);}return out;};
async function moduleWithStubs(path,override,globals={}) {
 const code=read(path),context=createContext({console,Date,URLSearchParams,...globals});
 const imports=new Map();
 for(const m of code.matchAll(/import\{([^}]+)\}from"([^"]+)"/g)) {
  const names=m[1].split(',').map(p=>p.trim().split(/\s+as\s+/)[0]);
  imports.set(m[2],names);
 }
 const module=new SourceTextModule(code,{context,identifier:path});
 await module.link(spec=>{const names=imports.get(spec)||[];
  return new SyntheticModule(names,function(){for(const name of names)this.setExport(name,override(spec,name)??(()=>{}));},{context});
 });await module.evaluate();return module.namespace;
}
function hooks(){
 const state=[];let cursor=0;
 return {state,start(){cursor=0;},react:{
  useState(initial){const index=cursor++;if(!(index in state))state[index]=typeof initial==='function'?initial():initial;return[state[index],v=>{state[index]=typeof v==='function'?v(state[index]):v;}];},
  useEffect(){},Suspense:'Suspense',
 },jsx:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'Fragment'}};
}
async function cardFixture(connect) {
 const h=hooks(),state={user:{uid:'fixture'},settings:{},profile:{sex:'m'},garminBusy:false,garminErr:null};
 const api=await moduleWithStubs(find('WahooCard-'),(spec,name)=>{
  if(spec.includes('vendor-'))return name==='r'?h.react:h.jsx;
  if(spec.includes('index-'))return name==='t'?s=>s:name==='_'?()=>Promise.resolve():()=>false;
  if(spec.includes('start-'))return ({u:()=>state,g4:()=>false,d:x=>x,g7:connect,B:'Button',m:'Card',r:()=>()=>null})[name];
  if(spec.includes('client-'))return name==='g'?()=>true:()=>Promise.resolve(true);
 });
 return {api,state,h,render(){h.start();return api.G({});}};
}
const connectButton=tree=>nodes(tree).find(n=>n.type==='Button'&&/Poveži z Garmin Connect|Odpiram Garminovo/.test(n.props.children));
const consentNode=tree=>nodes(tree).find(n=>typeof n.type==='function'&&'onDone'in n.props&&'mode'in n.props);

test('failed request immediately releases Connect and retains user checkbox choices',async()=>{
 let count=0;const d=deferred(),f=await cardFixture(()=>{count++;return d.promise;});
 connectButton(f.render()).props.onClick();
 const choice={upload:true,ai:false};const pending=consentNode(f.render()).props.onDone(choice);
 assert.equal(connectButton(f.render()).props.disabled,true);assert.equal(count,1);
 d.resolve(false);await pending;
 assert.equal(connectButton(f.render()).props.disabled,false);
 connectButton(f.render()).props.onClick();
 assert.deepEqual(consentNode(f.render()).props.initialChoice,choice);
});
test('a thrown connection error also releases busy state',async()=>{
 const f=await cardFixture(()=>Promise.reject(Error('fixture')));connectButton(f.render()).props.onClick();
 await assert.rejects(consentNode(f.render()).props.onDone({upload:false,ai:false}));
 assert.equal(connectButton(f.render()).props.disabled,false);
});
test('closing consent creates no connection request',async()=>{
 let calls=0;const f=await cardFixture(()=>{calls++;});connectButton(f.render()).props.onClick();
 consentNode(f.render()).props.onClose();assert.equal(consentNode(f.render()).props.mode,null);assert.equal(calls,0);
});
for(const message of ['Prijava je potekla — prijavi se znova.','Your session has expired — sign in again.','Deine Sitzung ist abgelaufen — bitte erneut anmelden.'])test('auth error shows sign-in action: '+message,async()=>{
 const f=await cardFixture(()=>{});f.state.garminErr=message;
 const buttons=nodes(f.render()).filter(n=>n.type==='Button');
 assert.ok(buttons.some(b=>b.props.children==='Prijavi se znova'));
 assert.equal(connectButton(f.render()),undefined);
});
test('consent reopens with chosen values, never invents optional permissions',async()=>{
 const h=hooks();const api=await moduleWithStubs(find('GarminConsentSheet-'),(spec,name)=>{
  if(spec.includes('vendor-'))return name==='r'?h.react:h.jsx;
  if(spec.includes('index-'))return s=>s;
  if(spec.includes('start-'))return ({d:x=>x,ab:s=>s,S:'Sheet',B:'Button'})[name];
 });let result;
 h.start();const tree=api.GarminConsentSheet({mode:'connect',initialChoice:{upload:true,ai:false},onClose(){},onDone:v=>{result=v;}});
 const button=nodes(tree).find(n=>n.type==='Button'&&n.props.children==='Nadaljuj na Garmin');button.props.onClick();
 assert.deepEqual(plain(result),{upload:true,ai:false});
});
async function storeFixture(connect) {
 const values=new Map(),messages=[],state={settings:{},profile:{},user:{uid:'fixture'}};
 const api=await moduleWithStubs(find('garminStore-'),(spec,name)=>{
  if(spec.includes('index-'))return name==='t'?s=>s:()=>false;
  if(spec.includes('start-'))return ({D:state,av:p=>Object.assign(state,p),t:(...a)=>messages.push(a)})[name];
  if(spec.includes('client-'))return ({s:connect,b:e=>e.message,G:Error})[name];
 },{localStorage:{setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k)}});
 return {api,state,values,messages};
}
test('store publishes failure and clears stale consent ticket choices',async()=>{
 const f=await storeFixture(async()=>{throw Error('Session expired');});
 assert.equal(await f.api.connectGarmin({upload:true,ai:true}),false);
 assert.equal(f.state.garminErr,'Session expired');assert.equal(f.values.size,0);assert.equal(f.messages.length,1);
});
test('store coalesces double taps without overwriting first consent choice',async()=>{
 let calls=0;const d=deferred(),f=await storeFixture(()=>{calls++;return d.promise;});
 const first=f.api.connectGarmin({upload:false,ai:false}),second=f.api.connectGarmin({upload:true,ai:true});
 assert.equal(first,second);assert.equal(calls,1);
 const choice=JSON.parse([...f.values.values()][0]);assert.equal(choice.upload,false);assert.equal(choice.ai,false);
 d.resolve();assert.equal(await first,true);assert.equal(f.state.garminErr,null);
});
test('store permits another attempt after failure',async()=>{
 let calls=0;const f=await storeFixture(async()=>{if(++calls===1)throw Error('offline');});
 assert.equal(await f.api.connectGarmin(),false);assert.equal(await f.api.connectGarmin(),true);assert.equal(calls,2);assert.equal(f.state.garminErr,null);
});
