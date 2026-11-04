// (3.76.22) Vrata kakovosti za AKTIVNO gradnjo — vse se razreši iz trenutnega index.html, nič ni vpisano po imenu (hash).
//  1. graf modulov: vstop iz index.html, vsak relativen uvoz (statičen in dinamičen) obstaja v assets/
//  2. sw.js: vsak vnos predpomnilnika obstaja; revizija (md5) se ujema z vsebino datoteke
//  3. testi v tej mapi, vezani na module po imenu: če ciljajo neaktivno gradnjo, se jasno označijo kot NEVELJAVNI za to
//     gradnjo (ne tiho zeleni). Vedenjske teste vzdržuje izvorni projekt (vitest, ~4 300 testov pred vsako objavo).
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
const read = p => readFileSync(new URL(p, root), 'utf8')
const fail = []
const html = read('index.html')
const entry = [...html.matchAll(/<script[^>]+type="module"[^>]+src="\/?([^"]+)"/g)].map(m => m[1])
if (!entry.length) fail.push('index.html: ni vstopnega modula')
const seen = new Set(), todo = [...entry], missing = []
while (todo.length) {
  const f = todo.pop(); if (seen.has(f)) continue
  if (!existsSync(new URL(f, root))) { missing.push(f); continue }
  seen.add(f)
  const src = read(f)
  for (const m of src.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']\.\/([A-Za-z0-9_.-]+\.(?:js|css))["']/g)) todo.push('assets/' + m[1])
  for (const m of src.matchAll(/["'](assets\/[A-Za-z0-9_.-]+\.(?:js|css))["']/g)) todo.push(m[1])
}
for (const m of missing) fail.push('manjka modul iz aktivnega grafa: ' + m)
const sw = read('sw.js')
let swN = 0, revN = 0
for (const m of sw.matchAll(/\{url:"([^"]+)",revision:(null|"([0-9a-f]+)")\}/g)) {
  swN++
  const [, url, , rev] = m
  if (!existsSync(new URL(url, root))) { fail.push('sw.js: predpomnjena datoteka manjka: ' + url); continue }
  if (rev) { revN++; const h = createHash('md5').update(readFileSync(new URL(url, root))).digest('hex'); if (h !== rev) fail.push(`sw.js: revizija ${url} ${rev} ≠ vsebina ${h}`) }
}
if (!swN) fail.push('sw.js: ni vnosov predpomnilnika')
const ver = (read([...seen].find(f => /assets\/index-[^/]+\.js$/.test(f)) || entry[0]).match(/"(3\.\d+\.\d+)"/) || [])[1] || '?'
const bound = []
for (const t of readdirSync(new URL('tests/', root)).filter(f => f.endsWith('.mjs') && f !== 'active-build.mjs')) {
  const refs = [...new Set([...read('tests/' + t).matchAll(/assets\/[A-Za-z0-9_-]+\.js/g)].map(m => m[0]))]
  const stale = refs.filter(r => !seen.has(r))
  if (stale.length) bound.push(`${t}: ${stale.length}/${refs.length} uvozov iz druge gradnje (${stale.slice(0, 3).join(', ')}${stale.length > 3 ? ' …' : ''})`)
}
console.log(`aktivna gradnja ${ver}: ${seen.size} modulov v grafu, ${swN} vnosov sw.js (${revN} z revizijo)`)
if (bound.length) console.log('NEVELJAVNO ZA TO GRADNJO (testi, vezani na imena modulov druge gradnje — ne zaganjam jih):\n  ' + bound.join('\n  '))
if (fail.length) { console.error('NAPAKA:\n  ' + fail.join('\n  ')); process.exit(1) }
console.log('AKTIVNA GRADNJA OK')
if (process.argv.includes('--legacy') && bound.length) { console.error('Zahtevan zagon testov druge gradnje: niso veljavni za aktivni index.html.'); process.exit(1) }
