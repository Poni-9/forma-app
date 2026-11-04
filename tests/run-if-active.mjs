// (3.76.22) Zažene test samo, če vsi moduli, ki jih uvaža po imenu, pripadajo aktivni gradnji (index.html). Sicer izpiše
// NI ZAGNANO z razlogom in korak ODPOVE (exit 2): korak, ki ne zažene nobenega scenarija, ne sme biti zelen (Codex QA-004).
// ODPRTO: app-smoke in daily-journeys uvažata start po imenu in notranja (stisnjena) imena izvozov ene gradnje — potrebujeta
// stabilen testni vstop v aplikaciji (načrtovano 3.76.23) in razrešitev starta iz aktivnega grafa.
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const root = new URL('../', import.meta.url)
const read = p => readFileSync(new URL(p, root), 'utf8')
const entry = [...read('index.html').matchAll(/<script[^>]+type="module"[^>]+src="\/?([^"]+)"/g)].map(m => m[1])
const seen = new Set(), todo = [...entry]
while (todo.length) { const f = todo.pop(); if (seen.has(f) || !existsSync(new URL(f, root))) continue; seen.add(f); const s = read(f); for (const m of s.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']\.\/([A-Za-z0-9_.-]+\.(?:js|css))["']/g)) todo.push('assets/' + m[1]); for (const m of s.matchAll(/["'](assets\/[A-Za-z0-9_.-]+\.(?:js|css))["']/g)) todo.push(m[1]) }
const [mode, ...files] = process.argv.slice(2)
let code = 0, skipped = 0
for (const f of files) {
  const refs = [...new Set([...read('tests/' + f).matchAll(/assets\/[A-Za-z0-9_-]+\.js/g)].map(m => m[0]))]
  const stale = refs.filter(r => !seen.has(r))
  if (stale.length) { console.error(`NI ZAGNANO ${f}: vezan na drugo gradnjo (${stale.join(', ')} ni v aktivnem index.html) — QA-004 odprto`); skipped++; continue }
  const r = spawnSync(process.execPath, mode === 'test' ? ['--experimental-vm-modules', '--test', f] : [f], { stdio: 'inherit', cwd: new URL('.', import.meta.url) })
  code ||= r.status ?? 1
}
process.exit(code || (skipped ? 2 : 0))
