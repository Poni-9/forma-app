import{t as f}from"./index-B0wed2Ut.js";import{k as F,m as $,n as P,o as K,q as j}from"./match-BvUbZXuz.js";const T=f(`---context:global
assign validForBikes = true
assign allow_steps           = false
assign allow_ferries         = true
assign allow_motorways       = false
assign use_proposed_cycleroutes = false
assign consider_traffic = true
assign consider_noise        = false
assign consider_river        = false
assign consider_forest       = false
assign consider_town         = true
assign consider_elevation = true
assign downhillcost       = 60
assign downhillcutoff     = 1.5
assign uphillcost         = 0
assign uphillcutoff       = 1.5
assign downhillcost       = if consider_elevation then downhillcost else 0
assign uphillcost         = if consider_elevation then uphillcost else 0
assign totalMass  = 90
assign maxSpeed   = 45
assign S_C_x      = 0.225
assign C_r        = 0.01
assign bikerPower = 100
assign turnInstructionMode          = 1
assign turnInstructionCatchingRange = 40
assign turnInstructionRoundabouts   = true
assign considerTurnRestrictions     = true
assign correctMisplacedViaPoints = false
assign correctMisplacedViaPointsDistance = 400
assign processUnusedTags            = false
---context:way
assign any_cycleroute
  switch not use_proposed_cycleroutes
    or route_bicycle_icn=yes or route_bicycle_ncn=yes or route_bicycle_rcn=yes route_bicycle_lcn=yes
    or route_bicycle_icn=yes|proposed or route_bicycle_ncn=yes|proposed or route_bicycle_rcn=yes|proposed route_bicycle_lcn=yes|proposed
assign nodeaccessgranted or any_cycleroute lcn=yes
assign ispaved or surface=paved or surface=asphalt or surface=concrete or surface=paving_stones or surface=sett or smoothness=excellent smoothness=good
assign isunpaved not or ispaved or ( and surface= smoothness= ) or surface=fine_gravel or surface=cobblestone smoothness=intermediate
assign turncost = if junction=roundabout then 0
                  else 90
assign initialclassifier =
     if route=ferry then 1
     else 0
assign initialcost switch route=ferry 10000 0
assign defaultaccess
       switch access=
              (
                    if motorroad=yes then false
                    else if highway=motorway|motorway_link then false
                    else true
              )
              switch or access=private access=no
                     false
                     true
assign bikeaccess =
       switch bicycle=
              switch bicycle_road=yes
                 true
                 switch vehicle=
                        ( if highway=footway then false else defaultaccess )
                        not vehicle=private|no
              not or bicycle=private or bicycle=no or bicycle=dismount bicycle=use_sidepath
assign footaccess =
       or bicycle=dismount
          switch foot=
                 defaultaccess
                 not or foot=private or foot=no foot=use_sidepath
assign accesspenalty
       switch bikeaccess
              0
              switch footaccess
                     5
                     switch any_cycleroute
                            15
                            switch bicycle=use_sidepath
                                   25
                                   10000
assign badoneway =
       if reversedirection=yes then
         if oneway:bicycle=yes then true
         else if oneway= then junction=roundabout
         else oneway=yes|true|1
       else oneway=-1
assign hascycleway = not
  and ( or cycleway= cycleway=no|none ) and ( or cycleway:left= cycleway:left=no ) and ( or cycleway:right= cycleway:right=no ) ( or cycleway:both= cycleway:both=no )
assign onewaypenalty =
       if ( badoneway ) then
       (
         if (
           and hascycleway
           or and cycleway:left=lane|track|shared_lane|share_busway
                  cycleway:left:oneway=no|-1
           or and cycleway:right=lane|track|shared_lane|share_busway
                  cycleway:right:oneway=no|-1
           or and cycleway:both=lane|track|shared_lane|share_busway
                  or cycleway:left:oneway=no|-1
                     cycleway:right:oneway=no|-1
           or cycleway=opposite|opposite_lane|opposite_track
           or cycleway:left=opposite|opposite_lane|opposite_track
              cycleway:right=opposite|opposite_lane|opposite_track
                                                             ) then 0
         else if ( oneway:bicycle=no                         ) then 0
         else if ( not footaccess                            ) then 100
         else if ( junction=roundabout|circular              ) then 60
         else if ( highway=primary|primary_link              ) then 50
         else if ( highway=secondary|secondary_link          ) then 30
         else if ( highway=tertiary|tertiary_link            ) then 20
         else 6.0
       )
       else 0.0
assign trafficpenalty =
      if not consider_traffic then 0
      else
      min switch hascycleway 0.3 100
      if   estimated_traffic_class=|1|2  then 0
      else if estimated_traffic_class=3 then multiply   0.3   consider_traffic
      else if estimated_traffic_class=4 then multiply   0.6   consider_traffic
      else if estimated_traffic_class=5 then multiply   0.9   consider_traffic
      else if estimated_traffic_class=6|7 then multiply 1.5   consider_traffic
      else 0
assign isresidentialorliving = or highway=residential|living_street living_street=yes
assign noise_penalty
   switch consider_noise
     switch estimated_noise_class=  0
     switch estimated_noise_class=1  0.3
     switch estimated_noise_class=2  0.5
     switch estimated_noise_class=3  0.7
     switch estimated_noise_class=4  1
     switch estimated_noise_class=5  1.2
     switch estimated_noise_class=6  1.5 0 0
assign no_river_penalty
   switch consider_river
     switch estimated_river_class=  3
     switch estimated_river_class=1  2
     switch estimated_river_class=2  1.5
     switch estimated_river_class=3  1
     switch estimated_river_class=4  0.5
     switch estimated_river_class=5  0.2
     switch estimated_river_class=6  0 99 0
assign no_forest_penalty
   switch consider_forest
     switch estimated_forest_class=  1
     switch estimated_forest_class=1  0.5
     switch estimated_forest_class=2  0.4
     switch estimated_forest_class=3  0.25
     switch estimated_forest_class=4  0.15
     switch estimated_forest_class=5  0.1
     switch estimated_forest_class=6  0 99 0
assign town_penalty
   switch consider_town
     switch estimated_town_class=  0
     switch estimated_town_class=1  0.2
     switch estimated_town_class=2  0.4
     switch estimated_town_class=3  0.6
     switch estimated_town_class=4  0.7
     switch estimated_town_class=5  0.8
     switch estimated_town_class=6  1 99 0
assign costfactor
  switch and highway= not route=ferry  10000
  switch or highway=proposed highway=abandoned 10000
  min 9999
  add max onewaypenalty accesspenalty
  add trafficpenalty
  add town_penalty
  add no_forest_penalty
  add no_river_penalty
  add noise_penalty
  switch or highway=motorway highway=motorway_link    switch allow_motorways 1.5 10000
  switch or highway=trunk highway=trunk_link          switch allow_motorways 1.5 10
  switch or highway=primary highway=primary_link      1.2
  switch or highway=secondary highway=secondary_link  1.1
  switch or highway=tertiary highway=tertiary_link    1.0
  switch    highway=unclassified                      switch isunpaved 10000 1.1
  switch    highway=pedestrian                        switch hascycleway 1.3 5
  switch    highway=steps                             switch allow_steps 120 10000
  switch    route=ferry                               switch allow_ferries 5.67 10000
  switch    highway=bridleway                         5
  switch    highway=cycleway                          switch isunpaved 10000 1.6
  switch    isresidentialorliving                     switch isunpaved 10000 1.4
  switch    highway=service                           switch isunpaved 10000 1.5
  switch or highway=track or highway=road or highway=path highway=footway
   switch ispaved 2.5 10000
  10.0
assign priorityclassifier =
  if      ( highway=motorway                         ) then  30
  else if ( highway=motorway_link                    ) then  29
  else if ( highway=trunk                            ) then  28
  else if ( highway=trunk_link                       ) then  27
  else if ( highway=primary                          ) then  26
  else if ( highway=primary_link                     ) then  25
  else if ( highway=secondary                        ) then  24
  else if ( highway=secondary_link                   ) then  23
  else if ( highway=tertiary                         ) then  22
  else if ( highway=tertiary_link                    ) then  21
  else if ( highway=unclassified                     ) then  20
  else if ( isresidentialorliving                    ) then  6
  else if ( highway=service                          ) then  6
  else if ( highway=cycleway                         ) then  6
  else if ( or bicycle=designated bicycle_road=yes   ) then  6
  else if ( highway=track                            ) then if tracktype=grade1 then 6 else 4
  else if ( highway=bridleway|road|path|footway      ) then  4
  else if ( highway=steps                            ) then  2
  else if ( highway=pedestrian                       ) then  2
  else 0
assign isbadoneway = not equal onewaypenalty 0
assign isgoodoneway = if reversedirection=yes then oneway=-1
                      else if oneway= then junction=roundabout else oneway=yes|true|1
assign isroundabout = junction=roundabout
assign islinktype = highway=motorway_link|trunk_link|primary_link|secondary_link|tertiary_link
assign isgoodforcars = if greater priorityclassifier 6 then true
                  else if ( or isresidentialorliving highway=service ) then true
                  else if ( and highway=track tracktype=grade1 ) then true
                  else false
assign classifiermask add          isbadoneway
                      add multiply isgoodoneway   2
                      add multiply isroundabout   4
                      add multiply islinktype     8
                          multiply isgoodforcars 16
assign dummyUsage = smoothness=
---context:node
assign defaultaccess
       switch access=
              1
              switch or access=private access=no
                     0
                     1
assign bikeaccess
       or nodeaccessgranted=yes
          switch bicycle=
                 switch vehicle=
                        defaultaccess
                        switch or vehicle=private vehicle=no
                               0
                               1
                 switch or bicycle=private or bicycle=no bicycle=dismount
                        0
                        1
assign footaccess
       or bicycle=dismount
          switch foot=
                 defaultaccess
                 switch or foot=private foot=no
                        0
                        1
assign initialcost
    switch or highway=traffic_signals and highway=crossing crossing=traffic_signals 250
       switch bikeaccess
              0
              switch footaccess
                     300
                     1000000
`),M="https://brouter.de/brouter",x="fastbike-lowtraffic",I=/^(gravel|unpaved|compacted|fine_gravel|dirt|earth|ground|grass|sand|mud|pebblestone|woodchips|rock)$/,O=/^(asphalt|paved|concrete|concrete:plates|paving_stones|sett|chipseal)$/;function q(e){if(!Array.isArray(e)||e.length<2||!Array.isArray(e[0]))return;const o=e[0],i=o.indexOf("Distance"),t=o.indexOf("WayTags"),n=o.indexOf("NodeTags");if(i<0||t<0)return;const s={signals:0,unpavedKm:0,urbanKm:0,cyclewayKm:0,bigRoadKm:0};for(const a of e.slice(1)){const l=(+a[i]||0)/1e3,h=String(a[t]||""),c=n>=0?String(a[n]||""):"",y=/(?:^|\s)highway=(\S+)/.exec(h)?.[1]||"",w=/(?:^|\s)surface=(\S+)/.exec(h)?.[1]||"";/traffic_signals/.test(c)&&s.signals++,(I.test(w)||/^(track|path|footway|bridleway)$/.test(y)&&!O.test(w))&&(s.unpavedKm+=l),/^(residential|living_street|service|pedestrian)$/.test(y)&&(s.urbanKm+=l),y==="cycleway"&&(s.cyclewayKm+=l),/^(primary|primary_link|trunk|trunk_link)$/.test(y)&&(s.bigRoadKm+=l)}for(const a of["unpavedKm","urbanKm","cyclewayKm","bigRoadKm"])s[a]=+s[a].toFixed(1);return s}const R=(e,o=3)=>[+e[0].toFixed(o),+e[1].toFixed(o)];async function m(e,o=x){const t=e.map((c,y)=>y===0||y===e.length-1?R(c):c).map(c=>`${c[1].toFixed(5)},${c[0].toFixed(5)}`).join("|"),n=await fetch(`${M}?lonlats=${t}&profile=${o}&alternativeidx=0&format=geojson`);if(!n.ok)throw new Error(f("Usmerjevalnik ni našel poti (HTTP {0}).",n.status));const a=(await n.json()).features?.[0],l=a?.geometry?.coordinates||[];if(l.length<2)throw new Error(f("Usmerjevalnik ni vrnil poti."));const h=j(l.map(c=>c[1]??null),l.map(c=>c[0]??null),l.map(c=>c[2]??null));return{pts:h.pts,alt:h.alt,km:+(+(a?.properties?.["track-length"]||0)/1e3).toFixed(1),q:q(a?.properties?.messages)}}let _=null;async function k(e=!1){if(!e&&_&&Date.now()-_.at<3*36e5)return _.id;try{const i=await(await fetch(`${M}/profile`,{method:"POST",body:T,headers:{"Content-Type":"text/plain"}})).json();if(i.profileid&&/^custom_\w+$/.test(i.profileid))return _={id:i.profileid,at:Date.now()},i.profileid}catch{}return _=null,null}async function b(e){const o=await k();if(o)try{return await m(e,o)}catch{const i=await k(!0);if(i)try{return await m(e,i)}catch{}}return m(e,x)}function D(e,o,i,t){const n=40/Math.max(10,e.km||40),s=e.q;return+((s?(s.signals*.08+s.unpavedKm*.5+s.urbanKm*.06+s.cyclewayKm*.03+s.bigRoadKm*.02)*n:0)+(i?o/8:0)-(t??0)*.8).toFixed(3)}function v(e,o,i){const n=o/6371,s=i*Math.PI/180,a=e[0]*Math.PI/180,l=e[1]*Math.PI/180,h=Math.asin(Math.sin(a)*Math.cos(n)+Math.cos(a)*Math.sin(n)*Math.cos(s)),c=l+Math.atan2(Math.sin(s)*Math.sin(n)*Math.cos(a),Math.cos(n)-Math.sin(a)*Math.sin(h));return[+(h*180/Math.PI).toFixed(5),+(c*180/Math.PI).toFixed(5)]}async function A(e,o,i,t){const n=R(e);if(t.via?.length){const r=[n,...t.via,n];return{routed:await b(r),via:r}}const s=r=>P(K(r.pts),r.alt),a=r=>D(r,$(s(r))/Math.max(1,r.km),t.wantFlat,t.known?t.known(r.pts):null),l=t.seed*137.5%360;let h=Math.max(4,o/60*26/3.9);const c=(r,d)=>[n,v(n,d,r-35),v(n,d,r+35),n],y=[];for(const r of[0,90,180,270]){const d=(l+r)%360,u=c(d,h);try{const g=await b(u);y.push({routed:g,via:u,th:d,p:a(g)})}catch{}}y.sort((r,d)=>r.p-d.p);const w=y[0];if(!w)throw new Error(f("Za to smer ni poti — poskusi znova."));let p=w;for(let r=0;r<2;r++){const d=i(s(p.routed)),u=o/Math.max(1,d);if(Math.abs(1-u)<.07)break;h=h*u;const g=c(w.th,h);try{p={routed:await b(g),via:g}}catch{break}}return p}function U(e,o,i,t){const n=F({id:`nova:${t}:${Date.now().toString(36)}`,source:"nova",name:i,date:t,rodeMin:null,via:o},e.pts,e.alt);return n&&e.q&&(n.quality=e.q),n}function C(e){const o=t=>`${Math.round(t[0]/.0014)}:${Math.round(t[1]/.002)}`,i=new Set;for(const t of e)for(const n of t)i.add(o(n));return t=>{if(!i.size||t.length<2)return 0;let n=0,s=0;for(let a=0;a<t.length;a+=2){const l=t[a],h=Math.round(l[0]/.0014),c=Math.round(l[1]/.002);s++;e:for(let y=-1;y<=1;y++)for(let w=-1;w<=1;w++)if(i.has(`${h+y}:${c+w}`)){n++;break e}}return s?+(n/s).toFixed(2):0}}function N(e,o,i){const t=s=>s.replace(/[<>&"']/g,a=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"})[a]),n=o.map((s,a)=>f('<trkpt lat="{0}" lon="{1}">{2}</trkpt>',s[0].toFixed(6),s[1].toFixed(6),i&&Number.isFinite(i[a])?f("<ele>{0}</ele>",Math.round(i[a])):"")).join("");return f(`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FORMAI" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>{0}</name></metadata><trk><name>{1}</name><type>cycling</type><trkseg>{2}</trkseg></trk></gpx>
`,t(e),t(e),n)}export{C as k,A as m,U as r,N as t};
