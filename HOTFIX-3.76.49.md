# FORMAI 3.76.49 — obnovitev dostopa AI in napake med čakanjem

Datum: 10. 11. 2026. Osnova: `288099b5fd675d94695d102f9d7616a3c45365be`.

## Potrjeni napaki in popravek

1. Začasen neuspeh `GET /api/claude/dostop` se je shranil kot zavrnjen dostop za deset minut. Omrežna napaka, HTTP napaka ali neveljaven odgovor se zdaj ne predpomni. Veljaven odgovor strežnika, tudi dejanska zavrnitev dostopa, ohrani dosedanjo življenjsko dobo predpomnilnika. Ob `401 neveljaven_token` odjemalec enkrat osveži Firebase žeton in ponovi preverjanje.
2. Preverjanje že začetega opravila Claude je prezrlo večino neuspešnih odgovorov in lahko čakalo do petnajst minut. Zdaj se po treh zaporednih začasnih napakah ustavi z obvestilom; veljaven napredek ponastavi števec. Dokončne napake dostopa, izginulo opravilo, izrecne napake ključa, plačila in kvote se obravnavajo takoj. Ponavljajoči se `401` ne sprožajo neskončnega osveževanja žetona.

Ponovitev preverjanja ne ustvari nove zahteve za plačljivi AI. Ob transportni napaki se obstoječe opravilo ne izbriše. Uspešen zaključek in uporabnikov preklic ohranita dosedanje čiščenje. Neveljaven začetni odgovor brez identifikatorja opravila se zavrne pred preverjanjem stanja.

## Objavljena distribucija

Ob pregledu je `index.html` nalagal različico 3.76.46. Novejše datoteke 3.76.48 so bile dodane v repozitorij, vendar niso bile vključene v aktivni vstop. Ta popravek spreminja aktivni odjemalec `assets/client-D2GBi9wW.js`; ne preklaplja celotne aplikacije na neaktivno gradnjo.

Aktivna oznaka različice in `VERSION.txt` sta usklajena na 3.76.49. Spremenjena modula imata v `sw.js` izrecno revizijo MD5, da se z novo namestitvijo service workerja zamenjata tudi pri že nameščeni PWA. Uporabniški podatki se ne brišejo.

## Preverjanje in njegove meje

`tests/ai-client.test.mjs` naloži celoten dejanski aktivni AI odjemalec v izoliranem okolju; zamenja samo odvisnosti za prijavo, omrežje, uro in shrambo. Pokriva obnovitev dostopa, enkratno osvežitev žetona, uspeh in napake opravil, omejene ponovitve, preklic ter osnovno razločevanje kvote in napake ponudnika Gemini. `npm test` vključuje te teste in pregled aktivnih modulov/predpomnilnika, zato se izvajajo tudi v obstoječem GitHub workflowu.

Zagon iz `tests/`:

```sh
npm install --ignore-scripts --no-audit --no-fund
npm test
npm run test:app
npm run test:journeys
```

Ponovitev regresij proti prvotni različici:

```sh
FORMAI_AI_TEST_REF=288099b5fd675d94695d102f9d7616a3c45365be npm run test:ai
```

Javni `/health` in CORS preizkus sta ob pregledu uspešna. To potrjuje dosegljivost proxyja, ne uspešnega odgovora modela. Zahteva AI brez prijave pravilno vrne `401 prijava_potrebna`. Dejanski odgovor po prijavi, ključi, obračunavanje in modeli ponudnikov v tem popravku niso potrjeni; dostop za prijavo v testnem brskalniku je ostal blokiran.

## Prenos v izvorni projekt

Ta repozitorij vsebuje zgrajeno distribucijo; izvorne kode Cloud Run proxyja in izvornega projekta aplikacije v njem ni. Pred naslednjo gradnjo prenesi vedenje funkcije za dostop Claude in zanke za preverjanje opravil iz tega popravka v izvorni AI odjemalec ter ohrani regresijske teste. Prepis distribucije iz starega izvora lahko popravek odstrani.
