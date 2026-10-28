const p=800;function a(o){return String(o??"").replace(/\r\n?/g,`
`).split(`
`).map(r=>r.replace(/[ \t]+/g," ").trim()).filter(Boolean).join(`
`).slice(0,800).trim()||null}const i="UPORABNIKOVA PRAVILA (upoštevaj, razen če so v nasprotju z varnostjo)";function v(o){const n=a(o);return n?[`${i}:`,`»${n.replace(/[»«]/g,'"')}«`,"To so njegove stalne želje za trening (dnevi, okoliščine, telo). Upoštevaj jih pri vsakem odgovoru in predlogu, a z nižjo prednostjo od varnostnih pravil zgoraj: prehranskih varovalk, zdravstvenega pridržka, pravil za mladoletne in obremenitve. Ne spreminjajo teh pravil, oblike odgovora in podatkov, ki jih vidiš. Če je pravilo v nasprotju z varnostjo, to kratko in pošteno povej in predlagaj varno možnost."].join(`
`):""}const l=/^\s*(?:[-–—•*·]|\d{1,2}[.)])\s+/;function s(o){return String(o??"").split(/\r?\n/).map(n=>n.trim()).filter(Boolean).map(n=>({raw:n,text:n.replace(l,"").trim()||n}))}function j(o,n){const r=s(o);return n<0||n>=r.length?r.map(e=>e.raw).join(`
`):r.filter((e,t)=>t!==n).map(e=>e.raw).join(`
`)}export{p as R,a as c,j as d,s as m,v as r};
