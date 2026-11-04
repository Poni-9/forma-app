# FORMAI 3.76.20 — zaključek preverjanja 4. 11. 2026

Vključuje vse popravke iz [3.76.19](HOTFIX-3.76.19.md) in dva dodatna robna primera, ponovljena s testom:

- `60g banana`, `120g banana`, `0,06kg banana` in `6dag banana` ohranijo prikaz v gramih tudi brez presledka med številko in enoto.
- Pri izvozu dveh zaporednih treningov, ki prečkata polnoč, ima tudi začetek drugega treninga pravilni datum in uro. Prej je lahko nastal zapis, kot je `24:40` na prejšnji datum; zdaj je to `00:40` naslednjega dne.

Ponovljiv postopek za prenos sprememb je `hotfix/apply-3.76.20.mjs`; zahteva osnovo 3.76.19. V izvorni projekt prenesi oba postopka (3.76.19 in 3.76.20) pred njegovo naslednjo objavo.

## Preverjanje

- 30 avtomatskih testov, zdaj razširjenih še za enote brez presledkov in drugi koledarski dogodek po polnoči.
- 156 modulov se razčleni in poveže brez manjkajočih odvisnosti ali izvozov.
- Integracijski zagon dejanske aplikacije: devet pogledov, drsenje levo/desno in hitri kliki med zavihki. Omrežje in shranjevanje sta v tem testu izolirana.
- Na živi 3.76.19: posodobitev z 3.76.18, ohranitev profila, shranjevanje 100 gramov banane kot 88 kcal in ohranitev po osvežitvi; začetek/pavza vadbe, vpis 20 kg in serije, nadaljevanje po osvežitvi, shranjevanje delne vadbe in pravilen tedenski števec.
- Na živi 3.76.19: vseh pet glavnih zavihkov pri 320, 390 in 1280 pikah brez vodoravnega prelivanja; med temi potmi brez napak ali opozoril v konzoli.

Meje preverjanja ostajajo enake kot v opombi 3.76.19: to ni meritev animacij na fizičnem telefonu, dejanska plačila, zunanji AI in OAuth/prenos na povezano uro pa niso preizkušeni od začetka do konca. Strežniška koda ni spremenjena.
