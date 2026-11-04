# FORMAI 3.76.22 — iz izvornega projekta (prvi QA krog)

Zgrajeno iz zasebnega izvornega projekta (commit `ef03e03`), ne s popravljanjem distribucije. Spremembe 3.76.19–21 so prenesene v izvorne module in imajo izvorne teste (vitest: 4 330 testov, vsi zeleni pred objavo).

## Preneseno iz 3.76.19–21
- Pager: tap ali poteg med umirjanjem gre v vrsto (zadnji cilj, tudi nazaj na začetni zavihek); posnetek zaslona ob mirovanju (MutationObserver); pripravljenost = `main[data-scr]`; `data-swipe` pred izrisom; dispose počisti vrsto. Drugače kot 3.76.19: pager se ne prestavi v začetni paket — prenos se začne takoj ob namestitvi (ločen kos, začetni paket ostane pod mejo).
- Enkraten listek brez rezerve `?t=`; stari `*AuthUrl` pomočniki odstranjeni.
- Natančne mase (1 g banane = 1 g, 0 g = ni vnosa), »60g«/»0,06kg« v gramih, druga seja čez polnoč v .ics.
- Osnutek obroka (sessionStorage, račun + dan, 24 h). Delna moč v traku, čipu, Prehrani; »Nadaljuj trening« pred vajami. Isti recept na Danes in v Prehrani. Bližnjice obrokov kot gumbi.
- Ni preneseno: ure v Sestavi na stotinke (dogovor: »~7 h«).

## Novo v 3.76.22
- Kamera v Prehrani takoj dosegljiva: opazovalec je prej štel ploščico pod spodnjo navigacijo kot »vidno« (prag 10 %, koren celo okno) in skril plavajoči gumb. Zdaj koren brez navigacije (izmerjeno), prag 90 %, ponovna meritev ob resize/orientaciji/tipkovnici.
- QA-001: delno opravljena moč je povsod »delno« (Plan: kljukica `aria-pressed="mixed"`, trak tedna, seznam tednov, števec tedna).
- QA-002: teža vsake serije (`exercises[].setKg`), tudi pri nadaljevanju; `kg` ostane največja (napredovanje). Stari zapisi brez `setKg`: tež ne izmišljamo.
- QA-003: serija na čas šteje samo, ko čas poteče (zapis `t`); »Preskoči« ne. Brez ene opravljene serije se nič ne zapiše in dan ostane neoznačen (prej: vseh 14 načrtovanih serij).
- Neposlano vprašanje Trenerju ostane ob menjavi zavihka; dvojni tap »Kot včeraj«/»Zabeleži« ne vpiše dvakrat.

## Vrata kakovosti v tem repozitoriju
`tests/active-build.mjs` razreši vstop iz aktivnega `index.html`: graf modulov (vsak uvoz obstaja), `sw.js` (datoteke obstajajo, revizije = md5 vsebine). Testi, vezani na imena modulov ene gradnje (`*-37619`, `meal-draft`, `app-smoke`, `daily-journeys`, `hotfix`, `pager`), se pri drugi gradnji izpišejo kot PRESKOČENO z razlogom — ne preverjajo več neaktivnih datotek. Vedenjske teste za 3.76.22 vzdržuje izvorni projekt.
