# FORMAI

**AI fitnes trener za kolesarjenje, moč in prehrano — v slovenščini.**

🔗 **V živo: [formai.si](https://formai.si)**

Progresivna spletna aplikacija (PWA), ki deluje na Androidu in iPhonu brez namestitve iz trgovine.

## Kaj zna

- 🚴 Analiza kolesarskih treningov (integracija **Strava API**)
- 💪 Načrti za trening moči, prilagojeni uporabniku
- 🥗 Prehranska priporočila
- 🤖 AI trener, ki odgovarja v slovenščini

## Arhitektura

| Del | Tehnologija |
|---|---|
| Frontend | PWA (HTML/CSS/JS), gostovanje na lastni domeni formai.si |
| Avtentikacija | Firebase Auth |
| Baza | Firestore |
| AI proxy | Google Cloud Run (europe-west1) — API ključi nikoli v frontend |
| Integracije | Strava API (OAuth) |

## Zasebnost

Podatki o aktivnostih iz Strave se **ne pošiljajo v AI pozive** — varovalka v kodi to strogo ločuje. AI nikoli ne sklepa o uporabnikovi neaktivnosti iz manjkajočih podatkov.

## Status

Aktiven razvoj (137+ commitov). Freemium model: Free + PRO.

---

Avtor: Blaž Gregorc · blaz.gregorc05@gmail.com


## Preverjanje trenutne objave

Popravek povezovanja Garmin 3.76.50, preizkusi in odprti strežniški CORS del: [HOTFIX-3.76.50.md](HOTFIX-3.76.50.md). `npm test` preverja tudi obnovitev prijave, časovne omejitve, dvojne klike in uporabniške izbire.

Popravek povezave AI 3.76.49, regresijski testi in navodila za prenos v izvorni projekt: [HOTFIX-3.76.49.md](HOTFIX-3.76.49.md). `npm test` preverja tudi aktivni AI odjemalec z nadzorovanimi omrežnimi odgovori.

Popravki 3.76.19–20, testi in navodila za prenos v izvorni projekt: [HOTFIX-3.76.21.md](HOTFIX-3.76.21.md).

V mapi `tests`: `npm install`, `npm test`, `npm run test:app`, `npm run test:journeys`. Ta repozitorij je objavljena distribucija; pred naslednjo objavo iz ločenega izvornega projekta prenesi tudi popravke, opisane v opombi.

