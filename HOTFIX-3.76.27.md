# FORMAI 3.76.27

- QA-010: uvoz .fit sprejme samo opravljeno vadbo (file_id activity). Načrtovani trening (workout), trasa (course), nastavitve in pokvarjena datoteka se ne shranijo; vadba brez GPS, utripa ali seje se sprejme. Arhiv ure take datoteke preskoči brez napake.
- QA-011: Skrbnik — »možno zatikanje« samo ob ≥ 3 tapih iste kontrole v ≤ 2 s brez vmesnega dogodka, v isti seji in na istem zaslonu; stopnjevalne kontrole (Naprej, +/−) izvzete; ime kontrole, zaslon, čas in kaj je sledilo. Napake ločene od »za preveriti«. »Preveri posodobitve« ima stalen id in se ustavi po 12 s.
- Vizualno: odziv ob pritisku (čipi, zavihki), diskretna potrditev zapisane serije, kljukica ob zaključku vadbe se nariše; manj gibanja: brez animacij.
- Opozorilo pred izvozom treninga, ko so cilji odprti (ni FTP ne pražnega utripa).
