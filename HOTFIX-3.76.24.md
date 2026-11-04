# FORMAI 3.76.24 — iz izvornega projekta (commit `99babf5`)

**QA-005 (Codex, potrjeno):** nakupovalni seznam ni pokril prikazanega današnjega recepta (Buddha skleda: brez avokada, premalo čičerike).

- **Vzrok (izmerjen):** Prehrana je današnji jedilnik računala z uro zdaj (zamujen nevpisan obrok gre iz načrta, kalorije v naslednje obroke → druge jedi) in ciljem z uro; nakupovalni seznam in Plan → dan sta ga računala brez ure in brez prehranskih želja → prvotni jedilnik (zajtrk, rižota, postrv).
- **Pravilo (eno za vse):** današnji jedilnik = isti klic kot Prehrana (cilj `{ today, hour }`, `hour` in `prefs` v `dayMealsOf`, »drug predlog« dneva). Uporabljajo ga Prehrana, Danes (naslednji obrok), nakupovalni seznam (danes samo nepojedeni obroki) in Plan → dan. Drugi dnevi: po načrtu.
- **Testi (padejo brez popravka):** zaslon Prehrana → nakupovalni seznam (3 in 7 dni) vsebuje vse sestavine preostalih današnjih receptov; Plan → današnji dan kaže iste recepte kot Prehrana. Domenski: »drug predlog«, odkljukana postavka ostane ob spremembi količine.
- Kljukice nakupa so po imenu (pred dvopičjem) — ob drugačni količini ostanejo.
