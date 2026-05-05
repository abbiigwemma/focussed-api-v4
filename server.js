const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── PURE JS EPHEMERIS ────────────────────────────────────────────────────────

function toJD(yr, mo, dy, hr) {
  if (mo <= 2) { yr--; mo += 12; }
  const A = Math.floor(yr / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25*(yr+4716)) + Math.floor(30.6001*(mo+1)) + dy + hr/24 + B - 1524.5;
}

function norm360(x) { return ((x % 360) + 360) % 360; }
function rad(x) { return x * Math.PI / 180; }

function getPlanetLon(JD, planet) {
  const T = (JD - 2451545.0) / 36525;
  switch (planet) {
    case 'Sun': {
      const M = rad(357.52911 + 35999.05029*T - 0.0001537*T*T);
      const C = (1.914602 - 0.004817*T - 0.000014*T*T)*Math.sin(M)
              + (0.019993 - 0.000101*T)*Math.sin(2*M)
              + 0.000289*Math.sin(3*M);
      const app = 280.46646 + 36000.76983*T + 0.0003032*T*T + C
                - 0.00569 - 0.00478*Math.sin(rad(125.04 - 1934.136*T));
      return norm360(app);
    }
    case 'Earth': {
      const M = rad(357.52911 + 35999.05029*T - 0.0001537*T*T);
      const C = (1.914602 - 0.004817*T - 0.000014*T*T)*Math.sin(M)
              + (0.019993 - 0.000101*T)*Math.sin(2*M)
              + 0.000289*Math.sin(3*M);
      const app = 280.46646 + 36000.76983*T + 0.0003032*T*T + C
                - 0.00569 - 0.00478*Math.sin(rad(125.04 - 1934.136*T));
      return norm360(app + 180);
    }
    case 'Moon': {
      const Lp = norm360(218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841);
      const D  = norm360(297.8501921 + 445267.1114034*T  - 0.0018819*T*T + T*T*T/545868);
      const M  = norm360(357.5291092 + 35999.0502909*T   - 0.0001536*T*T + T*T*T/24490000);
      const Mp = norm360(134.9633964 + 477198.8675055*T  + 0.0087414*T*T + T*T*T/69699);
      const F  = norm360(93.2720950  + 483202.0175233*T  - 0.0036539*T*T - T*T*T/3526000);
      const Dr=rad(D),Mr=rad(M),Mpr=rad(Mp),Fr=rad(F);
      let lon = Lp
        + 6.288774*Math.sin(Mpr)        + 1.274027*Math.sin(2*Dr-Mpr)
        + 0.658314*Math.sin(2*Dr)       + 0.213618*Math.sin(2*Mpr)
        - 0.185116*Math.sin(Mr)         - 0.114332*Math.sin(2*Fr)
        + 0.058793*Math.sin(2*Dr-2*Mpr) + 0.057066*Math.sin(2*Dr-Mr-Mpr)
        + 0.053322*Math.sin(2*Dr+Mpr)   + 0.045758*Math.sin(2*Dr-Mr)
        - 0.040923*Math.sin(Mr-Mpr)     - 0.034720*Math.sin(Dr)
        - 0.030383*Math.sin(Mr+Mpr)     + 0.015327*Math.sin(2*Dr-2*Fr)
        - 0.012528*Math.sin(Mpr+2*Fr)   + 0.010980*Math.sin(Mpr-2*Fr)
        + 0.010675*Math.sin(4*Dr-Mpr)   + 0.010034*Math.sin(3*Mpr)
        + 0.008548*Math.sin(4*Dr-2*Mpr) - 0.007888*Math.sin(2*Dr+Mr-Mpr)
        - 0.006766*Math.sin(2*Dr+Mr)    - 0.005163*Math.sin(Dr-Mpr)
        + 0.004987*Math.sin(Dr+Mr)      + 0.004036*Math.sin(2*Dr-Mr+Mpr)
        + 0.003994*Math.sin(2*Dr+2*Mpr) + 0.003861*Math.sin(4*Dr)
        + 0.003665*Math.sin(2*Dr-3*Mpr) - 0.002689*Math.sin(Mr-2*Mpr)
        + 0.002390*Math.sin(2*Dr-Mr-2*Mpr) - 0.002348*Math.sin(Dr+Mpr)
        + 0.002236*Math.sin(2*Dr-2*Mr)  - 0.002120*Math.sin(Mr+2*Mpr)
        - 0.002069*Math.sin(2*Mr)       + 0.002048*Math.sin(2*Dr-2*Mr-Mpr)
        - 0.001773*Math.sin(2*Dr+Mpr-2*Fr) - 0.001595*Math.sin(2*Dr+2*Fr)
        + 0.001215*Math.sin(4*Dr-Mr-Mpr) - 0.001110*Math.sin(2*Mpr+2*Fr)
        - 0.000892*Math.sin(3*Dr-Mpr)   - 0.000810*Math.sin(2*Dr+Mr+Mpr)
        - 0.000713*Math.sin(2*Mr-Mpr)   - 0.000487*Math.sin(Dr-2*Mpr);
      return norm360(lon);
    }
    case 'Mercury': {
      const L = norm360(252.250906 + 149472.6746358*T);
      const M = rad(norm360(168.650764 + 149472.515921*T));
      return norm360(L + 23.440*Math.sin(M) + 2.9818*Math.sin(2*M) + 0.5255*Math.sin(3*M) + 0.1058*Math.sin(4*M));
    }
    case 'Venus': {
      const L = norm360(181.979801 + 58517.815676*T);
      const M = rad(norm360(212.260680 + 58517.803875*T));
      return norm360(L + 0.7758*Math.sin(M) + 0.0033*Math.sin(2*M));
    }
    case 'Mars': {
      const L = norm360(355.433275 + 19140.2993313*T);
      const M = rad(norm360(319.994585 + 19139.858502*T));
      const M2 = rad(norm360(48.417 + 19139.860*T));
      return norm360(L + 10.6913*Math.sin(M) + 0.6228*Math.sin(2*M)
        + 0.0506*Math.sin(3*M) + 0.0046*Math.sin(4*M)
        - 0.0348*Math.cos(M)   - 0.0055*Math.cos(2*M)
        + 0.0024*Math.sin(M-M2) - 0.0013*Math.sin(M+M2));
    }
    case 'Jupiter': {
      const L = norm360(34.351519 + 3034.9056606*T);
      const M = rad(norm360(20.9 + 3034.906*T));
      return norm360(L + 5.5549*Math.sin(M) + 0.1683*Math.sin(2*M) + 0.0071*Math.sin(3*M));
    }
    case 'Saturn': {
      const L = norm360(50.077444 + 1222.1137943*T);
      const M  = rad(norm360(317.9 + 1222.114*T));
      const Mj = rad(norm360(20.9 + 3034.906*T));
      return norm360(L + 6.3585*Math.sin(M) + 0.2204*Math.sin(2*M) + 0.0106*Math.sin(3*M)
        - 0.8977*Math.sin(M-Mj) - 0.1565*Math.sin(2*M-Mj));
    }
    case 'Uranus': {
      const L = norm360(314.055005 + 428.4669983*T);
      const M = rad(norm360(142.5905 + 428.4677*T));
      return norm360(L + 5.3042*Math.sin(M) + 0.1534*Math.sin(2*M));
    }
    case 'Neptune': {
      const L = norm360(304.348665 + 218.4862002*T);
      const M = rad(norm360(267.767 + 218.4862*T));
      return norm360(L + 1.0302*Math.sin(M) + 0.0170*Math.sin(2*M));
    }
    case 'Pluto': {
      const L = norm360(238.956785 + 144.9600446*T);
      const M = rad(norm360(238.957 + 144.960*T));
      return norm360(L + 28.3150*Math.sin(M) + 4.3408*Math.sin(2*M) + 0.9517*Math.sin(3*M));
    }
    case 'NNode': return norm360(125.044555 - 1934.1361849*T + 0.0020762*T*T);
    case 'SNode': return norm360(125.044555 - 1934.1361849*T + 0.0020762*T*T + 180);
    default: throw new Error(`Unknown planet: ${planet}`);
  }
}

function getAscendant(JD, lat, lng) {
  const T = (JD - 2451545.0) / 36525;
  let GMST = norm360(280.46061837 + 360.98564736629*(JD-2451545) + 0.000387933*T*T - T*T*T/38710000);
  const LST  = norm360(GMST + lng);
  const eps  = rad(23.439291111 - 0.013004167*T);
  const LSTr = rad(LST);
  const latr = rad(lat);
  const y = Math.cos(LSTr);
  const x = -(Math.sin(LSTr)*Math.cos(eps) + Math.tan(latr)*Math.sin(eps));
  let asc = norm360(Math.atan2(y, x) * 180 / Math.PI);
  if (Math.cos(LSTr) < 0) asc = norm360(asc + 180);
  return asc;
}

function findDesignJD(birthJD) {
  const birthSunLon = getPlanetLon(birthJD, 'Sun');
  let lo = birthJD - 92, hi = birthJD - 84;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    let diff = birthSunLon - getPlanetLon(mid, 'Sun');
    if (diff < 0) diff += 360;
    if (diff > 88) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ─── HD ───────────────────────────────────────────────────────────────────────

const GATE_SEQ = [41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60];
const WHEEL_OFFSET = 292.5;

const CHANNELS = [
  [64,47,'Head','Ajna'],[61,24,'Head','Ajna'],[63,4,'Head','Ajna'],
  [17,62,'Ajna','Throat'],[11,56,'Ajna','Throat'],[43,23,'Ajna','Throat'],
  [7,31,'G','Throat'],[1,8,'G','Throat'],[13,33,'G','Throat'],[10,20,'G','Throat'],
  [25,51,'G','Heart'],[21,45,'Heart','Throat'],[26,44,'Heart','Spleen'],
  [40,37,'Heart','SolarPlexus'],[34,20,'Sacral','Throat'],[34,57,'Sacral','Spleen'],
  [34,10,'Sacral','G'],[3,60,'Sacral','Root'],[5,15,'Sacral','G'],
  [14,2,'Sacral','G'],[27,50,'Sacral','Spleen'],[29,46,'Sacral','G'],
  [42,53,'Sacral','Root'],[9,52,'Sacral','Root'],[59,6,'Sacral','SolarPlexus'],
  [22,12,'SolarPlexus','Throat'],[36,35,'SolarPlexus','Throat'],
  [49,19,'SolarPlexus','Root'],[39,55,'SolarPlexus','Root'],
  [30,41,'SolarPlexus','Root'],[6,59,'SolarPlexus','Sacral'],
  [18,58,'Spleen','Root'],[28,38,'Spleen','Root'],[32,54,'Spleen','Root'],
  [48,16,'Spleen','Throat'],[57,34,'Spleen','Sacral'],[57,20,'Spleen','Throat'],
  [38,28,'Root','Spleen'],[53,42,'Root','Sacral'],[60,3,'Root','Sacral'],
  [52,9,'Root','Sacral'],[41,30,'Root','SolarPlexus'],[19,49,'Root','SolarPlexus'],
  [54,32,'Root','Spleen']
];

const CHANNEL_NAMES = {'4-63':'Logic','7-31':'Alpha','1-8':'Inspiration','2-14':'Beat','3-60':'Mutation','5-15':'Rhythm','6-59':'Intimacy','9-52':'Concentration','10-20':'Awakening','11-56':'Curiosity','12-22':'Openness','13-33':'Prodigal','16-48':'Wavelength','17-62':'Acceptance','18-58':'Judgment','19-49':'Synthesis','20-34':'Charisma','20-57':'Brain Wave','21-45':'Money Line','23-43':'Structuring','24-61':'Awareness','25-51':'Initiation','26-44':'Surrender','27-50':'Preservation','28-38':'Struggle','29-46':'Discovery','30-41':'Recognition','32-54':'Transformation','34-10':'Exploration','34-57':'Power','35-36':'Transitoriness','37-40':'Community','39-55':'Emoting','41-30':'Fantasy','42-53':'Maturation','47-64':'Abstraction','48-16':'Wavelength','49-19':'Synthesis','50-27':'Preservation','51-25':'Initiation','52-9':'Determination','53-42':'Cyclic','54-32':'Transformation','55-39':'Emoting','56-11':'Curiosity','57-20':'Brain Wave','57-34':'Archetype','58-18':'Judgment','59-6':'Mating','60-3':'Acceptance','61-24':'Awareness','62-17':'Acceptance','63-4':'Logic','64-47':'Abstraction'};
const PROFILE_MAP   = {1:6,2:5,3:6,4:1,5:2,6:3};
const PROFILE_NAMES = {'1/3':'Investigator-Martyr','1/4':'Investigator-Opportunist','2/4':'Hermit-Opportunist','2/5':'Hermit-Heretic','3/5':'Martyr-Heretic','3/6':'Martyr-Role Model','4/6':'Opportunist-Role Model','4/1':'Opportunist-Investigator','5/1':'Heretic-Investigator','5/2':'Heretic-Hermit','6/2':'Role Model-Hermit','6/3':'Role Model-Martyr'};
const ZODIAC_SIGNS  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function lonToGateAndLine(lon) {
  const adj  = ((lon - WHEEL_OFFSET) % 360 + 360) % 360;
  const gi   = Math.floor(adj / (360/64)) % 64;
  const pos  = (adj % (360/64)) / (360/64);
  return { gate: GATE_SEQ[gi], line: Math.floor(pos*6)+1, lon: parseFloat(lon.toFixed(4)) };
}

function lonToSign(lon) {
  const sign = ZODIAC_SIGNS[Math.floor(lon/30)];
  const deg  = Math.floor(lon % 30);
  const min  = Math.floor((lon % 1) * 60);
  return { sign, deg, min, formatted: `${sign} ${deg}°${min}'` };
}

function determineType(ch, dc) {
  const sacDef = dc.has('Sacral');
  const sacThr = ch.some(c=>(c.c1==='Sacral'&&c.c2==='Throat')||(c.c1==='Throat'&&c.c2==='Sacral'));
  const motThr = ch.some(c=>{const m=['Heart','SolarPlexus','Spleen','Sacral'];return(m.includes(c.c1)&&c.c2==='Throat')||(m.includes(c.c2)&&c.c1==='Throat');});
  if(dc.size===0)return'Reflector';
  if(sacDef&&sacThr)return'Manifesting Generator';
  if(sacDef)return'Generator';
  if(motThr)return'Manifestor';
  return'Projector';
}

function determineAuthority(type, dc) {
  if(type==='Reflector')return'Lunar';
  if(type==='Generator'||type==='Manifesting Generator')return dc.has('SolarPlexus')?'Emotional (Solar Plexus)':'Sacral';
  if(type==='Manifestor'){if(dc.has('SolarPlexus'))return'Emotional (Solar Plexus)';if(dc.has('Heart'))return'Ego (Heart)';return'Splenic';}
  if(type==='Projector'){if(dc.has('SolarPlexus'))return'Emotional (Solar Plexus)';if(dc.has('Heart'))return'Ego (Heart)';if(dc.has('Spleen'))return'Splenic';if(dc.has('G'))return'Self-Projected';return'Mental (Environmental)';}
  return'Unknown';
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.get('/', (_req, res) => res.json({ status:'Focussed. API running', version:'2.0.0' }));

app.post('/api/chart', (req, res) => {
  try {
    const { year, month, day, hour=12, utcOffset=0, lat=null, lng=null } = req.body;
    if (!year||!month||!day) return res.status(400).json({ error:'year, month, day required' });

    const utcHour  = parseFloat(hour) - parseFloat(utcOffset);
    const birthJD  = toJD(parseInt(year), parseInt(month), parseInt(day), utcHour);
    const designJD = findDesignJD(birthJD);

    const planets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','NNode','SNode'];
    const conscious={}, unconscious={};

    for (const p of planets) {
      conscious[p]   = lonToGateAndLine(getPlanetLon(birthJD, p));
      unconscious[p] = lonToGateAndLine(getPlanetLon(designJD, p));
    }
    conscious['Earth']   = lonToGateAndLine(norm360(getPlanetLon(birthJD,  'Sun')+180));
    unconscious['Earth'] = lonToGateAndLine(norm360(getPlanetLon(designJD, 'Sun')+180));

    const allGates=new Set();
    for(const p of Object.keys(conscious)){allGates.add(conscious[p].gate);allGates.add(unconscious[p].gate);}

    const activatedChannels=[], definedCentres=new Set();
    for(const[g1,g2,c1,c2]of CHANNELS){
      if(allGates.has(g1)&&allGates.has(g2)){
        const key=[g1,g2].sort((a,b)=>a-b).join('-');
        activatedChannels.push({g1,g2,c1,c2,name:CHANNEL_NAMES[key]||''});
        definedCentres.add(c1);definedCentres.add(c2);
      }
    }

    const type=determineType(activatedChannels,definedCentres);
    const authority=determineAuthority(type,definedCentres);
    const sunLine=conscious['Sun'].line;
    const profileKey=`${sunLine}/${PROFILE_MAP[sunLine]||3}`;
    const profileName=PROFILE_NAMES[profileKey]||'';

    const sunSign  = lonToSign(getPlanetLon(birthJD,'Sun'));
    const moonSign = lonToSign(getPlanetLon(birthJD,'Moon'));
    let risingSign = null;
    if(lat!==null&&lng!==null){risingSign=lonToSign(getAscendant(birthJD,parseFloat(lat),parseFloat(lng)));}

    res.json({
      hd:{ type, authority, profile:`${profileKey} · ${profileName}`, definedCentres:[...definedCentres], channels:activatedChannels, conscious, unconscious, daysBack:parseFloat((birthJD-designJD).toFixed(2)) },
      astrology:{ sun:sunSign, moon:moonSign, rising:risingSign, hasRising:risingSign!==null },
      meta:{ birthJD:parseFloat(birthJD.toFixed(4)), designJD:parseFloat(designJD.toFixed(4)), hasExactTime:parseFloat(hour)!==12, hasLocation:lat!==null&&lng!==null }
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error:err.message||'Calculation failed' });
  }
});

app.get('/api/chart',(req,res)=>{req.body=req.query;app.handle(Object.assign(req,{method:'POST'}),res);});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Focussed. API running on port ${PORT}`));
