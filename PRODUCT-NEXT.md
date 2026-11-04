# Kaj bi FormAI naredilo bolj prepričljiv — predlog, ne že izvedene funkcije

Datum: 4. 11. 2026. Izhodišče: pregled žive aplikacije 3.76.20 ter popravki 3.76.21.

FormAI že ima veliko funkcij: prilagoditve treninga, recepte, dnevni pregled, napredek, integracije, fotografski vnos in trenerja. Naslednji preskok je v tem, kako razumljivo in zanesljivo te funkcije sodelujejo. Več kartic in daljše animacije same po sebi ne ustvarijo boljšega izdelka.

## Prednostni vrstni red

1. **Dnevni zaslon z enim glavnim dejanjem.** V prvem zaslonu: današnji trening ali počitek, kratka razlaga izbire in eno glavno dejanje. Detajli, dodatne ponudbe ter pomoč naj se odprejo po potrebi. Preizkus uspeha: pet novih uporabnikov brez razlage najde naslednji korak v desetih sekundah. Izvedeno v tej objavi: jasen začetek nadaljevanja delne vadbe.
2. **Prepričljiva prilagoditev, ki jo človek razume.** Obstoječe možnosti »Spremeni« in prilagoditve povezati v jasen tok: kaj se spremeni, zakaj, na katerih podatkih temelji in kako spremembo razveljaviš. Primer prikaza: »Danes imaš 25 minut; ohranimo glavni del, ostalo prestavimo.« Časi so uporabnikov podatek; negotovih meritev ne predstavljati kot dejstva. Izmeriti dokončanje prilagoditve in delež takojšnjih razveljavitev.
3. **Trening brez odvečnega tipkanja.** Izpostaviti zadnjo opravljeno težo/ponovitve, naslednjo serijo in počitek. Ena roka, veliki gumbi, brez izgube ob zaklepu zaslona. Zaključek naj pokaže res opravljen obseg in primerjavo z zadnjim primerljivim treningom; brez rekordov iz neprimerljivih podatkov. Izmeriti čas in število dotikov za vpis ene serije.
4. **Tedenski pregled, ki razloži napredek.** Iz obstoječih podatkov izpostaviti tri razumljive ugotovitve in eno naslednjo spremembo. Ločiti »ni podatka« od ničle. Pri malo vnosih pokazati, česa še ne vemo; ne dodajati navidezno natančne ocene napredka. Izmeriti, ali uporabnik zna povedati, kaj se je izboljšalo in kaj bo naredil naslednji teden.
5. **Prva uporabna izkušnja v manj kot minuti.** Najprej prikaz uporabnega dnevnega načrta, nato postopno dopolnjevanje profila. Kratek način preizkusa brez kartice; trenutek prijave naj ima jasen razlog, kot je varnostna kopija. Obveznih podatkov za smiselno priporočilo ne izpuščati samo zaradi hitrosti. Izmeriti čas do prvega začetega treninga ali shranjenega obroka.

## Kaj bi uredil pred širšo rastjo

- En skupen izvorni repozitorij, ki ga uporabljata oba razvijalca/agenta; spremembe prek ločenih vej in pregledov. Objava naj nastane iz tega vira. Trenutni popravki distribucije so začasen način dela.
- Izvorni preizkusi zamenjajo odvisnost trenutnih regresijskih testov od imen zgrajenih modulov. Ob večjem buildu je treba trenutne teste prilagoditi, ne samo odstraniti.
- Meritve resničnih naprav: cenejši Android, sodoben Android in iPhone/Safari; počasno omrežje, brez omrežja, ponovni zagon ter daljša vadba z zaklenjenim zaslonom. Brez tega ni podlage za trditev »vse je tekoče«.
- Pet do deset uporabnikov, opazovanih pri treh nalogah: začni/prilagodi trening, vpiši obrok, razloži svoj napredek. Beležiti ovire in nedokončane naloge, ne samo pohval.

## Tržna presoja

»AI trener« sam po sebi ni razlikovalna prednost. Fitbod že prilagaja vadbe po izvedbi, MacroFactor pa ponuja tedenske prilagoditve prehranskih ciljev. Smiselna začetna hipoteza za FormAI je jasna povezava kolesarjenja, moči in prehrane za slovensko govorečega rekreativca. To je hipoteza za preverjanje z uporabniki, ne dokaz tržnega uspeha.

Uspeh meriti z vračanjem v drugem in četrtem tednu, opravljenimi načrtovanimi dejanji, uspešnostjo shranjevanja in pripravljenostjo ciljnih uporabnikov za plačilo. Prenosi in število funkcij teh meril ne nadomestijo.

Viri, preverjeni 4. 11. 2026:
- [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) — zasnova prikaza podrobnosti po potrebi.
- [Fitbod: How does Fitbod adapt as I get stronger?](https://help.fitbod.me/hc/en-us/articles/43492523917207-How-does-Fitbod-adapt-as-I-get-stronger)
- [MacroFactor: Introduction to Check-Ins and Coaching Modules](https://help.macrofactorapp.com/en/articles/247-introduction-to-check-ins-and-coaching-modules)
