// (3.76.23, QA-004) Aktivni graf modulov iz trenutnega index.html — testi naj nikoli ne vpisujejo imen (hash) modulov.
import { readFileSync, existsSync } from 'node:fs'
const root = new URL('../', import.meta.url)
const read = p => readFileSync(new URL(p, root), 'utf8')
export function activeGraph() {
  const entry = [...read('index.html').matchAll(/<script[^>]+type="module"[^>]+src="\/?([^"]+)"/g)].map(m => m[1])
  const seen = new Set(), todo = [...entry]
  while (todo.length) {
    const f = todo.pop(); if (seen.has(f) || !existsSync(new URL(f, root))) continue
    seen.add(f)
    const s = read(f)
    for (const m of s.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']\.\/([A-Za-z0-9_.-]+\.(?:js|css))["']/g)) todo.push('assets/' + m[1])
    for (const m of s.matchAll(/["'](assets\/[A-Za-z0-9_.-]+\.(?:js|css))["']/g)) todo.push(m[1])
  }
  return { entry, modules: seen }
}
/** URL aktivnega modula po vzorcu imena (npr. /^assets\/start-/); napaka, če ga ni ali jih je več */
export function activeModule(re) {
  const hit = [...activeGraph().modules].filter(f => re.test(f))
  if (hit.length !== 1) throw new Error(`aktivni modul ${re}: najdenih ${hit.length} (${hit.join(', ')})`)
  return new URL(hit[0], root).href
}
/** stabilen testni vstop aplikacije (3.76.23+): globalThis.__FORMAI_QA__ */
export async function qaApp(timeoutMs = 5000) {
  globalThis.__FORMAI_QA_ENABLE__ = true
  await import(activeModule(/^assets\/start-[\w-]+\.js$/))
  for (let t = 0; t < timeoutMs; t += 10) { if (globalThis.__FORMAI_QA__) return globalThis.__FORMAI_QA__; await new Promise(r => setTimeout(r, 10)) }
  throw new Error('testni vstop __FORMAI_QA__ ni na voljo (gradnja pred 3.76.23?)')
}
