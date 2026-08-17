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
