# FORMAI 3.76.23 — iz izvornega projekta (commit `c429a60`)

- **QA-004:** stabilen testni vstop `globalThis.__FORMAI_QA__` (naloži se samo, ko test pred zagonom nastavi `__FORMAI_QA_ENABLE__ = true`; ločen kos). `tests/active-graph.mjs` razreši aktivni `start-*.js` iz trenutnega `index.html`. `app-smoke.mjs` in `daily-journeys.mjs` tečeta na aktivni gradnji (brez vpisanih imen modulov). Stari white-box testi 3.76.21 so arhiv (`npm run test:arhiv-37621`), niso del vrat.
- **QA-001 (retest):** »delno« tudi v Plan → Pregled → Tedni (»Ta teden«), seznamu prihodnjih dni in v ikoni dneva.
- **QA-002 (retest):** teže po serijah tudi na zaključku vadbe (»Tvoje serije«) in v seznamu Vadbe; neznana teža (star zapis) je »? kg«.
- **P3:** Plan → Spremeni dogovor → Nazaj = Plan (izvor v `od=`; neznan izvor → Nastavitve).
- Nadgradnja odprte 3.76.21 s podatki je bila lokalno preverjena (`e2e/nadgradnja.cjs`: Preveri posodobitve → Osveži → 3.76.22, podatki ostanejo).
