# FORMAI 3.76.19 — drsenje, enkratni listki in tehtana hrana

Osnova: `95029decb5a74b7acc66cb668bba6766a4e90f2d` (3.76.18). Datum: 4. 11. 2026.

## Kaj je popravljeno

- Upravljalnik drsenja se naloži skupaj z začetkom aplikacije. Prvi poteg ne sproži več šele nalaganja lastnega upravljalnika.
- Poteg ali klik med zaključevanjem prehoda se ohrani kot zahtevani cilj. Hitri kliki, tudi nazaj na začetni zavihek, ne izgubijo zadnje izbire.
- Čakanje na vsebino naslednjega zavihka ne zadržuje več drsenja: že prikazan nalagalni pogled omogoča nadaljnjo navigacijo.
- Kopija prejšnjega zaslona se pripravi med mirovanjem in razveljavi ob spremembi vsebine. Celoten zaslon se ne kopira več sredi zaključne animacije.
- Vhodne animacije naslednjega pogleda se izključijo pred njegovim prikazom, da se ne začne še druga animacija. Uničenje upravljalnika odstrani opazovalce in čakajoče ukaze.
- Strava, Wahoo in Garmin zahtevajo veljaven enkraten listek. Ob napaki zahteve, napačnem odgovoru ali napačni obliki listka povezovanje vrne obstoječe obvestilo za ponovni poskus. Rezervnega `?t=<Firebase ID token>` ni več, niti v starih pomožnih funkcijah za URL. Časovnik se počisti tudi ob izjemi.
- Tehtana hrana ohrani natančno količino do končnega zaokroževanja kalorij. 0 g ni več najmanj 0,05 kosa, 1 g banane ni več 6 g, eksplicitne mase ostanejo označene v gramih. Po vgrajeni tabeli: 100 g banane = 88 kcal, 200 g = 175 kcal.

## Pomembno za naslednjo objavo iz izvornega projekta

Ta repozitorij vsebuje javno zgrajeno aplikacijo; trenutnega zasebnega izvornega projekta v njem ni. Spremembe zato vsebujejo tudi berljiv, preverljiv postopek v `hotfix/apply-3.76.19.mjs`. Pred naslednjo objavo iz izvornega projekta prenesi te spremembe v njegove ustrezne module. Ponovna objava stare izvorne kode bi popravke povozila.

Postopek velja izključno za 3.76.18 in preveri vsako mesto zamenjave. Ob neujemajočem se vhodu odpove pred zapisom datotek. Priporočena uporaba za pregled je na ločeni kopiji osnovnega commita:

```
node hotfix/apply-3.76.19.mjs /pot/do/kopije-3.76.18
```

Prilagojeni moduli so zapisani v `hotfix/changed-files.json`. Izvorna logika za prenos je v komentarjih postopka, dodana logika vrste navigacije pa je berljivo zapisana tudi v modulu pager. Priprava novega izvornega builda je prednostna pred nadaljnjim ročnim urejanjem zgrajenih datotek.

Za to izdajo so ohranjena obstoječa imena notranjih modulov, vse njihove spremenjene Workbox revizije pa so izračunane iz dejanskih bajtov datotek. Odprta aplikacija mora sprejeti posodobitev in se osvežiti.

## Preverjeno pred objavo

- 15 preverjanj drsenja: vsi sosednji zavihki v obe smeri, robovi, navpičen in kratek poteg, preklic, drugi prst, vnosna polja, modalna okna, zmanjšano gibanje, prvi poteg, zaporedni potegi, počasna vsebina, hitri kliki, zunanja navigacija in čiščenje.
- 15 preverjanj osnovne logike: prehranske količine, ure/minute, enkratni listki in napake, koledarski izvoz, CSV, 156 povezanih modulov ter revizije PWA.
- Integracijski zagon dejanskih modulov React z ločeno testno shrambo: Danes, Plan, Prehrana, Trener, Vadbe, Napredek, Nastavitve, Uvoz in Vaje. Potega levo/desno in hitra klika med zavihki sta preizkušena tudi prek dejanskega usmerjevalnika aplikacije.

Zagon iz mape `tests`: `npm install`, `npm test`, `npm run test:app`. Integracijski test uporablja jsdom in fake-indexeddb, izključi zunanje omrežne klice ter ne spreminja produkcijskih uporabnikov.

## Meje preverjanja

Testi niso meritev FPS na pravem telefonu. Strežniška enkratnost in veljavnost listka, dejanska OAuth prijava, prenos na fizične ure, plačila, plačani AI, fotografiranje in strežniška pravila točkovanja potrebujejo ustrezno okolje oziroma račune. Ta objava ne trdi, da so bile te poti preverjene od začetka do konca. Strežniška koda ni bila spreminjana.
