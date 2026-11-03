import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root, p), 'utf8');
const start = read('assets/start-BRLivjHr.js');
const actions = read('assets/actions-D6Wf0Sxp.js');
const translate = (s, ...args) => s.replace(/\{(\d+)\}/g, (_, i) => args[i] ?? `{${i}}`);

// Exercise the functions in the shipped bundle, not a reimplementation.
function extract(source, marker, expression = false) {
  const at = source.indexOf(marker);
  assert.ok(at >= 0, `Missing ${marker}`);
  for (let end = source.indexOf('}', at); end >= 0; end = source.indexOf('}', end + 1)) {
    const code = source.slice(at, end + 1);
    try { new vm.Script(expression ? `(${code})` : code); return code; } catch {}
  }
  throw Error(`Cannot extract ${marker}`);
}
const foods = vm.runInNewContext(`(${extract(start.slice(start.indexOf('ue={') + 3), '{', true)})`, { n: translate });
const foodContext = vm.createContext({ nn: foods, t: translate });
vm.runInContext(actions.slice(actions.indexOf('const Si='), actions.indexOf('const Ri=')), foodContext);
const parse = text => vm.runInContext(`Lo(${JSON.stringify(text)})`, foodContext);
const context = vm.createContext({ n: translate });
vm.runInContext('const nt=e=>e.type==="fitnes"||e.type==="doma";' + extract(start, 'function gn(') + 'const Di=e=>e.length-gn(e).size;' + extract(start, 'function ve(') + extract(start, 'function cl('), context);

test('explicit fruit masses scale continuously instead of rounding to half-pieces', () => {
  for (const [input, kcal] of [['100 g banana',88],['200 g banana',175],['10 g banana',9],['50 g banana',44],['0,2 kg banana',175],['20 dag banana',175],['banana, 100 g',88],['100 g jabolko',53],['100 gramov banana',88],['0,2 kilograma banane',175],['20 dekagramov banane',175]]) {
    assert.equal(parse(input).kcal, kcal, input);
  }
  assert.equal(parse('200 g banana').items[0].qty, '200 g');
  assert.equal(parse('banana, 100 g').items[0].qty, '100 g');
  assert.equal(parse('banana, 100 gramov').kcal, 88);
  assert.equal(parse('0,2 kilograma banane').items[0].qty, '200 g');
});
test('piece counts, fractions, multiple foods and ordinary gram foods still work', () => {
  for (const [input, kcal] of [['1 banana',105],['2 banani',210],['pol banane',53],['1/4 banane',26],['100 g oves',370],['100 g banana in 100 g oves',458],['2 x 100 g banana',175]]) {
    assert.equal(parse(input).kcal, kcal, input);
  }
  assert.equal(parse('neznana hrana'), null);
  assert.equal(parse('0 g banana'), null);
});
test('weekly summary preserves actual minutes', () => {
  for (const [minutes, expected] of [[[45,45,45],'2 h 15 min'], [[40,40,40],'2 h'], [[30,30,30],'1 h 30 min'], [[60,60,60,60],'4 h']]) {
    const sessions = minutes.map((min, day) => ({ type:'fitnes', day, min }));
    const result = vm.runInContext(`cl(${JSON.stringify({sessions})})`, context);
    assert.ok(result.includes(expected), result);
  }
});
test('onboarding volume summary keeps quarter-hours', () => {
  const c = vm.createContext({ a: translate });
  vm.runInContext(extract(read('assets/Sestavi-f9G-etRO.js'),'function Mo('), c);
  assert.match(vm.runInContext('Mo([1.5,1.75,2],{sessions:[{min:45},{min:45},{min:45}]})', c), /1,5–2 h.*2,25 h/);
});
test('missing meal entries are not represented as confirmed skipped meals', () => {
  const food = read('assets/Prehrana-DNMBZnT3.js');
  assert.ok(food.includes('c.skipped?t("ni vpisa")'));
  assert.ok(!food.includes('sicer trener misli, da nisi'));
  for (const lang of ['en-BMTd5c9l-hf37617','de-D191_Syp-hf37617']) assert.ok(read(`assets/${lang}.js`).includes('Danes ni vpisanih obrokov. Brez vnosov ni mogoče oceniti zaužite hrane.'));
});
test('active module graph parses and referenced JS assets exist', () => {
  const queue=['assets/index-CVr2kr2U.js'], seen=new Set();
  while(queue.length) {
    const name=queue.pop();if(seen.has(name))continue;seen.add(name);
    const code = read(name);
    new vm.SourceTextModule(code);
    for (const match of code.matchAll(/["']((?:\.\/|\/?assets\/)[^"'<> ]+\.js)["']/g)) {
      const file=match[1].startsWith('./')?`${dirname(name)}/${match[1].slice(2)}`:match[1].replace(/^\//,'');
      assert.ok(existsSync(resolve(root,file)), `${name}: ${file}`);queue.push(file);
    }
  }
  assert.ok(seen.size > 100, 'Active module graph was traversed');
});
test('PWA revisions match patched files and languages have fresh URLs', () => {
  const sw = read('sw.js');
  for (const name of ['actions-D6Wf0Sxp','start-BRLivjHr','Sestavi-f9G-etRO','Prehrana-DNMBZnT3','pager-Dj7_ZNIM','index-CVr2kr2U']) {
    const file = `assets/${name}.js`;
    const md5 = createHash('md5').update(read(file)).digest('hex');
    assert.ok(sw.includes(`{url:"${file}",revision:"${md5}"}`), file);
  }
  const entry=read('assets/index-CVr2kr2U.js');
  for(const name of ['en-BMTd5c9l-hf37617.js','de-D191_Syp-hf37617.js']) {
    assert.ok(entry.includes(name));assert.ok(existsSync(resolve(root,'assets',name)));
  }
  assert.ok(entry.includes('ct="3.76.17"'));
});
