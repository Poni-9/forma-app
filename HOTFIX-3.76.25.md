# FORMAI 3.76.25

- QA-006: zamenjana vaja v nadaljevani vadbi — stara obdrži narejene serije, nova dobi preostale; predlog zamenjave ne ponudi vaje, ki je že v dnevu.
- Poteg med zavihki: dotik na elementu, ki ga izris med potegom zamenja (zmanjšano gibanje, dva potega zapored), se ne izgubi.
- Preverjeno: vitest 4346/4346, tsc, e2e brez povezave (pravi service worker) in potegi s CDP dotiki (Chromium, ne fizičen telefon).
