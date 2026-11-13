# FORMAI 3.76.50 — obnova prijave pri povezovanju Garmina

Datum: 13. 11. 2026. Osnova: `fed8249252224e64f22dc97970d217224d5cb351` (3.76.49).

## Kaj popravek spremeni

Če izdaja enkratnega povezovalnega listka zavrne obstoječi Firebase žeton, Garminov odjemalec enkrat prisilno osveži žeton in ponovi zahtevo. Trajni neuspeh zahteva novo prijavo. Dva sočasna klika uporabljata isto opravilo in iste uporabnikove izbire; menjava računa med opravilom prepreči preusmeritev.

Na živem strežniku je bilo neodvisno potrjeno: `OPTIONS /api/auth/ticket` vrne ustrezen CORS, dejanski `POST` brez prijave oziroma s sintetičnim neveljavnim žetonom pa vrne `401` brez `Access-Control-Allow-Origin`. Kontrolni `/garmin/status` vrne berljiv `401` z ustreznim CORS. Pri transportni napaki ticket zahteve odjemalec zato enkrat preveri prijavo prek obstoječega **bralnega** `/garmin/status`. Samo njegov dejanski `401` sproži osvežitev. Omrežne napake, `403`, `429` in `5xx` niso samodejno razglašene za poteklo prijavo. Diagnostični klic se ne izvaja na običajni uspešni poti ali kadar brskalnik sporoča offline.

Izdaja listka lahko traja do 20 sekund namesto petih. Celotno opravilo je omejeno na 30 sekund, branje žetona na 10 sekund in dodatna diagnoza na sedem sekund. Napake ohranijo status in vrsto (prijava, zavrnitev, omejitev klicev, strežnik, neveljaven odgovor, povezava, timeout, preklic). Poljubno besedilo strežnika se ne izpisuje uporabniku. Nova sporočila so prevedena v angleščino in nemščino.

Gumb se ob koncu ali napaki takoj sprosti; prejšnje čakanje s fiksnim 20-sekundnim časovnikom je odstranjeno. Napaka ostane vidna na kartici. Pri težavi s prijavo se ponudi ponovna prijava tudi v angleščini in nemščini. Izbiri pošiljanja treningov in uporabe v AI se za ročno ponovitev ohranita v pomnilniku iste kartice, ob menjavi računa pa ponastavita. Novi ali ponovno naloženi obrazec brez izrecnih izbir ima obe možnosti izključeni. Soglasja se ne podelijo samodejno.

URL še vedno vsebuje samo enkraten listek `k`. Firebase in Garmin žetoni se ne zapisujejo v URL ali diagnostiko. Podatki o uporabnikih, treningih in prehrani se ne spreminjajo.

## Odprti strežniški del in meje

**To ni popravek strežniške CORS konfiguracije.** Google Cloud Console v dostopnem oblačnem brskalniku vrne »Site Unavailable«, Cloud Run izvor in pooblaščen CLI pa nista dosegljiva. Odjemalska obnova deluje, če je zavrnitev ticket zahteve posledica neveljavne prijave in naslednja izdaja listka z novim žetonom uspe. Ne more popraviti napačnih Garmin ključev, callback URL, ponudnikovih dovoljenj ali manjkajočega CORS tudi na uspešnem ticket odgovoru. Teh vzrokov pri konkretnem uporabniku iz dnevnika klikov ni mogoče potrditi.

Ko je strežniški izvor dosegljiv, je treba na `/api/auth/ticket` nastaviti obstoječe dovoljene CORS glave **pred vsakim zgodnjim izhodom**, tudi pri `401/403/429/5xx`. Ohraniti je treba seznam dovoljenih izvorov, `Vary: Origin` in preverjanje žetona. Test mora primerjati preflight in dejanski odgovor za dovoljen izvor ter zavrniti nedovoljen izvor. Ne dodajati wildcard CORS, novega javnega proxyja ali tokenov v URL.

Prava prijava v Garmin in končna potrditev dovoljenj nista bili izvedeni. Sintetični testi niso pravi OAuth E2E ali dokaz, da je uporabnikov račun že povezan.

## Preverjanje

- 52 novih testov dejansko dosegljivih modulov: 42 za odjemalec/listke in 10 za kartico, soglasja in shrambo. Omrežje, prijava, ura in UI hook adapter so nadzorovani.
- 32 obstoječih AI testov ostane uspešnih; popravek 3.76.49 je ohranjen.
- Pregled aktivne gradnje: 173 modulov, 168 vnosov predpomnilnika, ujemajoče revizije.
- Obstoječi `test:app`: devet pogledov, dejanski React prehodi/potegi in hitri kliki v jsdom; brez runtime napak.
- Obstoječi `test:journeys`: devet scenarijev prehrane, osnutkov in delnih vadb; brez runtime napak.
- Tri ključne regresije (berljiv401, skrit401 in429) na izvirni osnovi padejo, na popravku uspejo.

```sh
cd tests
npm install --ignore-scripts --no-audit --no-fund
npm test
npm run test:app
npm run test:journeys
```

Za dokaz prejšnjih regresij:

```sh
FORMAI_GARMIN_TEST_REF=fed8249252224e64f22dc97970d217224d5cb351 node --experimental-vm-modules --test --test-name-pattern='readable 401 refreshes exactly|CORS-hidden 401 is recovered|HTTP 429 preserves' garmin-auth.test.mjs
```

## Izvor in ponovljivost

Repozitorij še vedno vsebuje distribucijo. Berljiva nova logika je v `hotfix/source/3.76.50/`, celoten omejen poseg pa v `hotfix/apply-3.76.50.mjs`. Skripta pred pisanjem preveri SHA256 osnovnih datotek ter ustreznost vsake zamenjave; ni splošen nadomestek za izvorni build. Spremenjeni moduli imajo nove izrecne Workbox revizije; novi moduli so dodani v predpomnilnik. Uporabniške shrambe se ne brišejo.

Pred naslednjo gradnjo ločenega izvornega projekta prenesi logiko ticket napak, Garminove obnove in spremembe kartice/soglasij v njegove izvorne module ter zaženi regresijske teste. Sam prepis distribucije iz starega izvora lahko odstrani ta popravek in popravek 3.76.49.
