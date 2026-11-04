# FORMAI 3.76.21 — jasnejši dnevni pregled in osnutki hrane

Osnova: `bf61d057e90d99665d22eba3dbe62535b10f1075` (3.76.20). Datum: 4. 11. 2026.

## Kaj se spremeni za uporabnika

- Napisano besedilo obroka ostane ob preklopu zavihka in osvežitvi istega zavihka brskalnika. Osnutki so ločeni po računu in dnevu; po 24 urah potečejo. Preklic predogleda jih ohrani, uspešno shranjevanje oziroma predaja obroka obstoječi čakalni vrsti jih počisti. Zaprtje seje brskalnika jih lahko odstrani. Osnutki se ne pošiljajo na strežnik.
- Delna vadba moči ima v tedenskem traku oznako za delno izvedbo, ne kljukice za dokončan trening. Enako velja za opis treninga v Prehrani in besedilo za bralnike zaslona.
- Velik gumb »Nadaljuj trening« je pri delni vadbi pred seznamom vaj. Odpre obstoječi način za preostale serije, brez spremembe shranjenih serij.
- Naslednji recept na Danes uporablja celoten načrt obrokov in iste prehranske želje kot Prehrana. Izločanje predvadbenega obroka pred izbiro receptov je prej spremenilo tudi druge recepte; to je povzročilo npr. »Kruh s skuto« na enem zaslonu in »Ajdove palačinke« na drugem.
- Bližnjice do obrokov so dostopnim tehnologijam predstavljene kot gumbi, ne kot navadne postavke seznama.

## Preverjanje

- 33 regresijskih testov: 15 za potege, 15 za osnovno logiko in module, 3 za shrambo osnutkov. Poveže se vseh 157 aktivnih modulov; spremenjene revizije predpomnilnika ustrezajo vsebini.
- 9 dodatnih preizkusov dejanske aplikacije: isti recept na obeh zaslonih, delna/celotna vadba, položaj nadaljevanja, dostopni gumbi, ohranitev osnutka med zavihki in dnevi, preklic predogleda ter čiščenje po shranjevanju.
- Integracijski pregled devetih pogledov, potegov levo/desno in hitrih klikov med zavihki.
- GitHub workflow `App quality` te preglede ponovi ob PR in objavi na `main`. Ne spreminja produkcijskih računov in ne kliče plačljivih API-jev. To ni nastavitev obvezne zaščite veje: neposredna objava lahko še vedno prehiti rezultat testa.

Testi uporabljajo jsdom in ločeno testno shrambo. Ne merijo FPS na telefonu in ne preverjajo plačil, plačanega AI ali dejanskih povezav z urami.

## Prenos v izvorni projekt

Trenutnega izvornega projekta v tem repozitoriju še vedno ni. Pred njegovo naslednjo objavo prenesi spremembe 3.76.19–21 v ustrezne izvorne module.

Nova logika osnutkov je berljiva v `assets/meal-draft-37621.js`. `hotfix/apply-3.76.21.mjs` je preverljiv postopek za natančno osnovo 3.76.20; komentarji opisujejo tudi popravke dnevnega pregleda in izbire recepta. Samo kopiranje starih zgrajenih datotek ob novem buildu ni dolgoročna rešitev.

Zagon iz `tests`: `npm install`, `npm test`, `npm run test:app`, `npm run test:journeys`.

Naslednje večje izboljšave: [PRODUCT-NEXT.md](PRODUCT-NEXT.md).
