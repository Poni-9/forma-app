# FORMAI — izvorna koda

`formai-v2-src.zip` je celotna izvorna koda aplikacije, ki teče na https://formai.si (Vite + React + TypeScript, PWA).

```bash
unzip formai-v2-src.zip -d formai-v2 && cd formai-v2
npm ci
npm test                      # vitest
BASE_PATH=/ npx vite build    # dist/ → koren repozitorija (index.html, assets/, icons/, sw.js, workbox-*.js, manifest.webmanifest)
```

Ob objavi prekopiraj vsebino `dist/` v koren tega repozitorija. `forma-trener.html` in `kalorije.html` sta preusmeritvi za stare namestitve.
