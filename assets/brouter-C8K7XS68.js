import{k as $,m as R,n as F,o as P,q as K}from"./match-Bqaw8FqP.js";const j=`---context:global
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
`,v="https://brouter.de/brouter",M="fastbike-lowtraffic",T=/^(gravel|unpaved|compacted|fine_gravel|dirt|earth|ground|grass|sand|mud|pebblestone|woodchips|rock)$/,I=/^(asphalt|paved|concrete|concrete:plates|paving_stones|sett|chipseal)$/;function O(e){if(!Array.isArray(e)||e.length<2||!Array.isArray(e[0]))return;const o=e[0],a=o.indexOf("Distance"),i=o.indexOf("WayTags"),s=o.indexOf("NodeTags");if(a<0||i<0)return;const t={signals:0,unpavedKm:0,urbanKm:0,cyclewayKm:0,bigRoadKm:0};for(const n of e.slice(1)){const l=(+n[a]||0)/1e3,h=String(n[i]||""),c=s>=0?String(n[s]||""):"",y=/(?:^|\s)highway=(\S+)/.exec(h)?.[1]||"",w=/(?:^|\s)surface=(\S+)/.exec(h)?.[1]||"";/traffic_signals/.test(c)&&t.signals++,(T.test(w)||/^(track|path|footway|bridleway)$/.test(y)&&!I.test(w))&&(t.unpavedKm+=l),/^(residential|living_street|service|pedestrian)$/.test(y)&&(t.urbanKm+=l),y==="cycleway"&&(t.cyclewayKm+=l),/^(primary|primary_link|trunk|trunk_link)$/.test(y)&&(t.bigRoadKm+=l)}for(const n of["unpavedKm","urbanKm","cyclewayKm","bigRoadKm"])t[n]=+t[n].toFixed(1);return t}const x=(e,o=3)=>[+e[0].toFixed(o),+e[1].toFixed(o)];async function p(e,o=M){const i=e.map((c,y)=>y===0||y===e.length-1?x(c):c).map(c=>`${c[1].toFixed(5)},${c[0].toFixed(5)}`).join("|"),s=await fetch(`${v}?lonlats=${i}&profile=${o}&alternativeidx=0&format=geojson`);if(!s.ok)throw new Error(`Usmerjevalnik ni našel poti (HTTP ${s.status}).`);const n=(await s.json()).features?.[0],l=n?.geometry?.coordinates||[];if(l.length<2)throw new Error("Usmerjevalnik ni vrnil poti.");const h=K(l.map(c=>c[1]??null),l.map(c=>c[0]??null),l.map(c=>c[2]??null));return{pts:h.pts,alt:h.alt,km:+(+(n?.properties?.["track-length"]||0)/1e3).toFixed(1),q:O(n?.properties?.messages)}}let g=null;async function b(e=!1){if(!e&&g&&Date.now()-g.at<3*36e5)return g.id;try{const a=await(await fetch(`${v}/profile`,{method:"POST",body:j,headers:{"Content-Type":"text/plain"}})).json();if(a.profileid&&/^custom_\w+$/.test(a.profileid))return g={id:a.profileid,at:Date.now()},a.profileid}catch{}return g=null,null}async function m(e){const o=await b();if(o)try{return await p(e,o)}catch{const a=await b(!0);if(a)try{return await p(e,a)}catch{}}return p(e,M)}function q(e,o,a,i){const s=40/Math.max(10,e.km||40),t=e.q;return+((t?(t.signals*.08+t.unpavedKm*.5+t.urbanKm*.06+t.cyclewayKm*.03+t.bigRoadKm*.02)*s:0)+(a?o/8:0)-(i??0)*.8).toFixed(3)}function k(e,o,a){const s=o/6371,t=a*Math.PI/180,n=e[0]*Math.PI/180,l=e[1]*Math.PI/180,h=Math.asin(Math.sin(n)*Math.cos(s)+Math.cos(n)*Math.sin(s)*Math.cos(t)),c=l+Math.atan2(Math.sin(t)*Math.sin(s)*Math.cos(n),Math.cos(s)-Math.sin(n)*Math.sin(h));return[+(h*180/Math.PI).toFixed(5),+(c*180/Math.PI).toFixed(5)]}async function E(e,o,a,i){const s=x(e);if(i.via?.length){const r=[s,...i.via,s];return{routed:await m(r),via:r}}const t=r=>F(P(r.pts),r.alt),n=r=>q(r,R(t(r))/Math.max(1,r.km),i.wantFlat,i.known?i.known(r.pts):null),l=i.seed*137.5%360;let h=Math.max(4,o/60*26/3.9);const c=(r,d)=>[s,k(s,d,r-35),k(s,d,r+35),s],y=[];for(const r of[0,90,180,270]){const d=(l+r)%360,f=c(d,h);try{const u=await m(f);y.push({routed:u,via:f,th:d,p:n(u)})}catch{}}y.sort((r,d)=>r.p-d.p);const w=y[0];if(!w)throw new Error("Za to smer ni poti — poskusi znova.");let _=w;for(let r=0;r<2;r++){const d=a(t(_.routed)),f=o/Math.max(1,d);if(Math.abs(1-f)<.07)break;h=h*f;const u=c(w.th,h);try{_={routed:await m(u),via:u}}catch{break}}return _}function S(e,o,a,i){const s=$({id:`nova:${i}:${Date.now().toString(36)}`,source:"nova",name:a,date:i,rodeMin:null,via:o},e.pts,e.alt);return s&&e.q&&(s.quality=e.q),s}function A(e){const o=i=>`${Math.round(i[0]/.0014)}:${Math.round(i[1]/.002)}`,a=new Set;for(const i of e)for(const s of i)a.add(o(s));return i=>{if(!a.size||i.length<2)return 0;let s=0,t=0;for(let n=0;n<i.length;n+=2){const l=i[n],h=Math.round(l[0]/.0014),c=Math.round(l[1]/.002);t++;e:for(let y=-1;y<=1;y++)for(let w=-1;w<=1;w++)if(a.has(`${h+y}:${c+w}`)){s++;break e}}return t?+(s/t).toFixed(2):0}}function U(e,o,a){const i=t=>t.replace(/[<>&"']/g,n=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"})[n]),s=o.map((t,n)=>`<trkpt lat="${t[0].toFixed(6)}" lon="${t[1].toFixed(6)}">${a&&Number.isFinite(a[n])?`<ele>${Math.round(a[n])}</ele>`:""}</trkpt>`).join("");return`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FORMAI" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${i(e)}</name></metadata><trk><name>${i(e)}</name><type>cycling</type><trkseg>${s}</trkseg></trk></gpx>
`}export{A as k,E as m,S as r,U as t};
