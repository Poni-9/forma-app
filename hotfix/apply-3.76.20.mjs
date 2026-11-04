// Follow-up to 3.76.19: two additional edge cases found by release testing.
// Apply to a separate copy of 3.76.19. All edits are checked before writing.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(process.argv[2]||dirname(fileURLToPath(import.meta.url))+'/..'),staged=new Map();
const read=p=>staged.get(p)??readFileSync(resolve(root,p),'utf8');
function edit(path,from,to){const source=read(path);if(source.split(from).length!==2)throw Error('Unexpected build: '+path);staged.set(path,source.replace(from,to));}
edit('assets/index-B0oLxdFS.js','ct="3.76.19"','ct="3.76.20"');
edit('assets/actions-DQA3mpOX.js','const __formaiMass=e=>/(?:^|\\s)',
  'const __formaiMass=e=>/(?:^|[\\s\\d])');
// Calendar times are floating local times. Normalise both start and end dates,
// so the second workout after a midnight crossing is not written as 24:40.
edit('assets/ics-0nu6Uaze.js','const R=e.date.replace(/-/g,""),i=new Date(`${e.date}T00:00:00`);',
  'const startDate=new Date(`${e.date}T00:00:00`);startDate.setMinutes(M);const R=`${startDate.getFullYear()}${String(startDate.getMonth()+1).padStart(2,"0")}${String(startDate.getDate()).padStart(2,"0")}`,i=new Date(`${e.date}T00:00:00`);');
edit('assets/ics-0nu6Uaze.js','t("DTSTART:{0}T{1}",R,I(M))','t("DTSTART:{0}T{1}",R,I(M%1440))');
let sw=read('sw.js');
for(const [path,content] of staged){
  const escaped=path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp('(url:"'+escaped+'",revision:)(?:null|"[^"]+")(})');
  if(!re.test(sw))throw Error('Missing precache record: '+path);
  const hash=createHash('md5').update(content).digest('hex');sw=sw.replace(re,'$1"'+hash+'"$2');
}
staged.set('sw.js',sw);
const all=[...new Set([...JSON.parse(read('hotfix/changed-files.json')),...staged.keys()])];
staged.set('hotfix/changed-files.json',JSON.stringify(all,null,2)+'\n');
for(const [path,content] of staged)writeFileSync(resolve(root,path),content);
console.log(JSON.stringify({version:'3.76.20',changed:[...staged.keys()]},null,2));
