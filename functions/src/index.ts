import 'dotenv/config';
import * as functions from 'firebase-functions';
import * as fs from 'fs';
import * as path from 'path';

// Environment variables: set in functions/.env
// - CONGRESS_API_KEY: Congress.gov API key (https://api.congress.gov/)
// - OPENSTATES_API_KEY: OpenStates API key (https://openstates.org/)

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`${name} is required`);
  return v.trim();
}

// Map of FIPS (string) to state postal code
const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL','02': 'AK','04': 'AZ','05': 'AR','06': 'CA','08': 'CO','09': 'CT','10': 'DE','11': 'DC','12': 'FL','13': 'GA',
  '15': 'HI','16': 'ID','17': 'IL','18': 'IN','19': 'IA','20': 'KS','21': 'KY','22': 'LA','23': 'ME','24': 'MD','25': 'MA',
  '26': 'MI','27': 'MN','28': 'MS','29': 'MO','30': 'MT','31': 'NE','32': 'NV','33': 'NH','34': 'NJ','35': 'NM','36': 'NY',
  '37': 'NC','38': 'ND','39': 'OH','40': 'OK','41': 'OR','42': 'PA','44': 'RI','45': 'SC','46': 'SD','47': 'TN','48': 'TX',
  '49': 'UT','50': 'VT','51': 'VA','53': 'WA','54': 'WV','55': 'WI','56': 'WY'
};

// Full state name -> USPS abbreviation (for Congress.gov responses that may use full names)
const STATE_NAME_TO_ABBR: Record<string, string> = {
  'alabama': 'AL','alaska': 'AK','arizona': 'AZ','arkansas': 'AR','california': 'CA','colorado': 'CO','connecticut': 'CT','delaware': 'DE','district of columbia': 'DC','florida': 'FL','georgia': 'GA',
  'hawaii': 'HI','idaho': 'ID','illinois': 'IL','indiana': 'IN','iowa': 'IA','kansas': 'KS','kentucky': 'KY','louisiana': 'LA','maine': 'ME','maryland': 'MD','massachusetts': 'MA',
  'michigan': 'MI','minnesota': 'MN','mississippi': 'MS','missouri': 'MO','montana': 'MT','nebraska': 'NE','nevada': 'NV','new hampshire': 'NH','new jersey': 'NJ','new mexico': 'NM','new york': 'NY',
  'north carolina': 'NC','north dakota': 'ND','ohio': 'OH','oklahoma': 'OK','oregon': 'OR','pennsylvania': 'PA','rhode island': 'RI','south carolina': 'SC','south dakota': 'SD','tennessee': 'TN','texas': 'TX',
  'utah': 'UT','vermont': 'VT','virginia': 'VA','washington': 'WA','west virginia': 'WV','wisconsin': 'WI','wyoming': 'WY'
};

function normalizeMemberState(m: any): string | undefined {
  const raw = m.state || m.stateCode || m.terms?.[0]?.state || m.terms?.[0]?.stateCode;
  if (!raw) return undefined;
  if (typeof raw === 'string' && raw.length === 2) return raw.toUpperCase();
  if (typeof raw === 'string') {
    const lowered = raw.toLowerCase().trim();
    return STATE_NAME_TO_ABBR[lowered];
  }
  return undefined;
}

function getCurrentChamberTerm(m: any, chamber: 'Senate' | 'House of Representatives') {
  const terms = m.terms?.item || m.terms || [];
  if (Array.isArray(terms)) {
    // Find the last term matching the requested chamber (senate or house)
    for (let i = terms.length - 1; i >= 0; i--) {
      const t = terms[i];
      if (!t) continue;
      const termChamber = t.chamber;
      if (!termChamber) continue;
      // Congress.gov uses exact strings like 'Senate' and 'House of Representatives'
      if (termChamber.toLowerCase() === chamber.toLowerCase()) return t;
    }
  }
  return undefined;
}

type GeoResult = {
  lat: number;
  lng: number;
  stateFips: string; // e.g., '17'
  state: string; // e.g., 'IL'
  congressional?: string; // e.g., '13'
  sldu?: string; // state legislative district upper
  sldl?: string; // state legislative district lower
};

async function geocodeWithCensus(address: string): Promise<GeoResult | null> {
  const url = new URL('https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress');
  url.searchParams.set('address', address);
  url.searchParams.set('benchmark', 'Public_AR_Current');
  url.searchParams.set('vintage', 'Current_Current');
  url.searchParams.set('format', 'json');
  // Let API return all available geographies (includes congressional and state legislative)

  const resp = await fetch(url.toString());
  if (!resp.ok) return null;
  const data = await resp.json() as any;
  const match = data?.result?.addressMatches?.[0];
  if (!match) return null;

  const lat = match.coordinates?.y;
  const lng = match.coordinates?.x;

  const geos = match.geographies || {};
  // Congressional district naming may vary by Congress number
  const cdKey = Object.keys(geos).find(k => /Congressional Districts/i.test(k));
  const cdObj = cdKey ? geos[cdKey]?.[0] : undefined;
  const cd = cdObj?.DISTRICT || cdObj?.BASENAME || cdObj?.CONG_DIST;

  // State legislative
  const slduKey = Object.keys(geos).find(k => /State Legislative Districts.*Upper|SLDU/i.test(k));
  const sldlKey = Object.keys(geos).find(k => /State Legislative Districts.*Lower|SLDL/i.test(k));
  const slduObj = slduKey ? geos[slduKey]?.[0] : undefined;
  const sldlObj = sldlKey ? geos[sldlKey]?.[0] : undefined;

  const stateFips = (cdObj?.STATE || slduObj?.STATE || sldlObj?.STATE || match?.geographies?.States?.[0]?.STATE) as string | undefined;
  if (!stateFips) return null;
  const state = FIPS_TO_STATE[stateFips.padStart(2, '0')];
  if (!state) return null;

  return {
    lat: Number(lat),
    lng: Number(lng),
    stateFips: stateFips.padStart(2, '0'),
    state,
    congressional: cd ? String(cd).padStart(2, '0') : undefined,
    sldu: slduObj?.BASENAME || slduObj?.DISTRICT,
    sldl: sldlObj?.BASENAME || sldlObj?.DISTRICT,
  };
}

async function fetchFederalFromCongressGov(state: string, congressional?: string) {
  const API = requireEnv('CONGRESS_API_KEY');
  const base = 'https://api.congress.gov/v3/member';

  // Senators - Congress.gov API response has 'state' field, not 'stateCode'
  const senUrl = `${base}?state=${encodeURIComponent(state)}&chamber=Senate&currentMember=true&limit=250&format=json&api_key=${API}`;
  const senResp = await fetch(senUrl);
  let senators: any[] = [];
  if (senResp.ok) {
    const senJson: any = await senResp.json();
    const allSens = senJson?.members || [];
    // Filter by state field (can be 'state', 'stateCode', or nested in 'terms')
    senators = allSens.filter((m: any) => {
      const term = getCurrentChamberTerm(m, 'Senate');
      const rawState = term?.state || term?.stateCode || m.state || m.stateCode;
      let normalized: string | undefined;
      if (rawState) {
        if (rawState.length === 2) normalized = rawState.toUpperCase();
        else normalized = STATE_NAME_TO_ABBR[rawState.toLowerCase().replace(/\./g,'').trim()];
      } else {
        normalized = normalizeMemberState(m);
      }
      return normalized === state;
    });
    if (!senators.length) {
      // Log sample keys to diagnose mismatch
      const sample = allSens[0];
      functions.logger.info('Senator filtering produced 0 results; sample member', {
        keys: sample ? Object.keys(sample) : [],
        sample,
        expectedState: state,
        normalizedStates: allSens.map((m: any) => {
          const term = getCurrentChamberTerm(m,'Senate');
          const rawState = term?.state || term?.stateCode || m.state || m.stateCode;
          if (!rawState) return undefined;
          if (rawState.length === 2) return rawState.toUpperCase();
          return STATE_NAME_TO_ABBR[rawState.toLowerCase().replace(/\./g,'').trim()];
        }).filter(Boolean)
      });
    }
    functions.logger.info(`Senators: fetched ${allSens.length}, filtered to ${senators.length} (state=${state})`);
  }

  // House
  let house: any[] = [];
  if (congressional) {
    const repUrl = `${base}?state=${encodeURIComponent(state)}&chamber=House&district=${encodeURIComponent(congressional)}&currentMember=true&limit=250&format=json&api_key=${API}`;
    const repResp = await fetch(repUrl);
    if (repResp.ok) {
      const repJson: any = await repResp.json();
      const allReps = repJson?.members || [];
      house = allReps.filter((m: any) => {
        const term = getCurrentChamberTerm(m,'House of Representatives');
        const rawState = term?.state || term?.stateCode || m.state || m.stateCode;
        const rawDistrict = term?.district || m.district;
        let normalizedState: string | undefined;
        if (rawState) {
          if (rawState.length === 2) normalizedState = rawState.toUpperCase();
          else normalizedState = STATE_NAME_TO_ABBR[rawState.toLowerCase().replace(/\./g,'').trim()];
        }
        const normalizedDistrict = rawDistrict ? String(rawDistrict).padStart(2,'0') : undefined;
        return normalizedState === state && normalizedDistrict === String(congressional).padStart(2,'0');
      });
      if (!house.length) {
        const sample = allReps[0];
        functions.logger.info('House filtering produced 0 results; sample member', {
          keys: sample ? Object.keys(sample) : [],
          sample,
          expectedState: state,
          expectedDistrict: congressional,
          normalizedStates: allReps.map((m: any) => {
            const term = getCurrentChamberTerm(m,'House of Representatives');
            const rawState = term?.state || term?.stateCode || m.state || m.stateCode;
            if (!rawState) return undefined;
            if (rawState.length === 2) return rawState.toUpperCase();
            return STATE_NAME_TO_ABBR[rawState.toLowerCase().replace(/\./g,'').trim()];
          }).filter(Boolean),
          districts: allReps.map((m: any) => {
            const term = getCurrentChamberTerm(m,'House of Representatives');
            return term?.district || m.district;
          })
        });
      }
      functions.logger.info(`House: fetched ${allReps.length}, filtered to ${house.length} (state=${state} district=${congressional})`);
    }
  }

  // Map to Civic-ish format
  const officials: any[] = [];
  const offices: any[] = [];
  const seenIds = new Set<string>();

  for (const s of senators) {
    const id = s.bioguideId || s.bioguide_id || s.uri || s.name;
    if (id && seenIds.has(id)) continue;
    officials.push({
      name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      party: s.partyName || s.party,
      phones: s.phone ? [s.phone] : undefined,
      urls: s.url ? [s.url] : undefined,
      photoUrl: s.bioguideId ? `https://theunitedstates.io/images/congress/225x275/${s.bioguideId}.jpg` : undefined,
    });
    if (id) seenIds.add(id);
    offices.push({
      name: 'United States Senator',
      divisionId: `ocd-division/country:us/state:${state.toLowerCase()}`,
      levels: ['country'],
      roles: ['legislatorUpperBody'],
      officialIndices: [officials.length - 1],
    });
  }

  for (const r of house) {
    const id = r.bioguideId || r.bioguide_id || r.uri || r.name;
    if (id && seenIds.has(id)) continue;
    officials.push({
      name: r.name || `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      party: r.partyName || r.party,
      phones: r.phone ? [r.phone] : undefined,
      urls: r.url ? [r.url] : undefined,
      photoUrl: r.bioguideId ? `https://theunitedstates.io/images/congress/225x275/${r.bioguideId}.jpg` : undefined,
    });
    if (id) seenIds.add(id);
    offices.push({
      name: 'United States Representative',
      divisionId: `ocd-division/country:us/state:${state.toLowerCase()}${congressional ? `/cd:${congressional}` : ''}`,
      levels: ['country'],
      roles: ['legislatorLowerBody'],
      officialIndices: [officials.length - 1],
    });
  }

  return { officials, offices };
}

// Fallback using public UnitedStates legislators dataset (used if Congress.gov filtering fails)
let cachedUnitedStatesData: any[] | null = null;
async function fetchFallbackFederal(state: string, congressional?: string) {
  if (!cachedUnitedStatesData) {
    const sources = [
      // CDN mirror (jsDelivr) — often more reliable than raw.githubusercontent
      'https://cdn.jsdelivr.net/gh/unitedstates/congress-legislators@main/legislators-current.json',
      // prefer 'main' branch (most repos have moved to main)
      'https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json',
      // fallback to master branch if present
      'https://raw.githubusercontent.com/unitedstates/congress-legislators/master/legislators-current.json',
      // alternative mirror (no 'the' prefix)
      'https://unitedstates.io/congress-legislators/legislators-current.json',
      // older mirror
      'https://theunitedstates.io/congress-legislators/legislators-current.json'
    ];
    for (const url of sources) {
      try {
        const resp = await fetch(url, { headers: { 'User-Agent': 'Firebase-Cloud-Function' } });
        if (resp.ok) {
          cachedUnitedStatesData = await resp.json() as any[];
          functions.logger.info('Fallback dataset loaded', { url, count: cachedUnitedStatesData.length });
          break;
        } else {
          functions.logger.warn('Fallback dataset fetch failed', { url, status: resp.status, statusText: resp.statusText });
        }
      } catch (e: any) {
        functions.logger.warn('Fallback dataset network error', { url, error: e?.message });
      }
    }
    if (!cachedUnitedStatesData) {
      // Try local bundled copy as last resort to guarantee availability
      try {
        const localPath = path.join(__dirname, 'data', 'legislators-current.json');
        const raw = fs.readFileSync(localPath, { encoding: 'utf8' });
        cachedUnitedStatesData = JSON.parse(raw) as any[];
        functions.logger.info('Fallback dataset loaded from local bundle', { path: localPath, count: cachedUnitedStatesData.length });
      } catch (e: any) {
        functions.logger.warn('No local fallback dataset available', { error: e?.message });
        cachedUnitedStatesData = [];
      }
    }
  }
  const senators: any[] = [];
  const house: any[] = [];
  for (const person of cachedUnitedStatesData || []) {
    const roles: any[] = person.roles || [];
    for (const r of roles) {
      if (!r || r.type !== 'senator' || !r.state) continue;
      if (r.state === state) {
        // Bioguide ID and party
        senators.push({
          name: `${person.name?.official_full || person.name?.first + ' ' + person.name?.last}`.trim(),
          partyName: r.party,
          party: r.party,
          bioguideId: person.id?.bioguide,
          phone: r.phone,
          url: r.url,
          state: state,
        });
      }
    }
    for (const r of roles) {
      if (!r || r.type !== 'representative' || !r.state) continue;
      if (r.state === state && congressional && String(r.district).padStart(2,'0') === String(congressional).padStart(2,'0')) {
        house.push({
          name: `${person.name?.official_full || person.name?.first + ' ' + person.name?.last}`.trim(),
            partyName: r.party,
            party: r.party,
            bioguideId: person.id?.bioguide,
            phone: r.phone,
            url: r.url,
            state: state,
            district: r.district
        });
      }
    }
  }
  // Reduce to current two senators (roles array is ordered newest last typically) – ensure unique by bioguide
  const senMap = new Map<string, any>();
  for (const s of senators) if (s.bioguideId && !senMap.has(s.bioguideId)) senMap.set(s.bioguideId, s);
  const finalSens = Array.from(senMap.values()).slice(0, 2);
  
  functions.logger.info('Fallback federal selection', {
    senatorsFound: senators.length,
    senatorsUnique: finalSens.length,
    houseFound: house.length,
    houseFiltered: house.slice(0,1).length,
    senatorNames: finalSens.map(s => s.name),
    houseNames: house.slice(0,1).map(h => h.name),
    expectedDistrict: congressional
  });
  
  return mapFederalToCivic(finalSens, house.slice(0,1), state, congressional);
}

function mapFederalToCivic(senators: any[], house: any[], state: string, congressional?: string) {
  const officials: any[] = [];
  const offices: any[] = [];
  for (const s of senators) {
    officials.push({
      name: s.name,
      party: s.partyName || s.party,
      phones: s.phone ? [s.phone] : undefined,
      urls: s.url ? [s.url] : undefined,
      photoUrl: s.bioguideId ? `https://theunitedstates.io/images/congress/225x275/${s.bioguideId}.jpg` : undefined,
    });
    offices.push({
      name: 'United States Senator',
      divisionId: `ocd-division/country:us/state:${state.toLowerCase()}`,
      levels: ['country'],
      roles: ['legislatorUpperBody'],
      officialIndices: [officials.length - 1],
    });
  }
  for (const r of house) {
    officials.push({
      name: r.name,
      party: r.partyName || r.party,
      phones: r.phone ? [r.phone] : undefined,
      urls: r.url ? [r.url] : undefined,
      photoUrl: r.bioguideId ? `https://theunitedstates.io/images/congress/225x275/${r.bioguideId}.jpg` : undefined,
    });
    offices.push({
      name: 'United States Representative',
      divisionId: `ocd-division/country:us/state:${state.toLowerCase()}${congressional ? `/cd:${congressional}` : ''}`,
      levels: ['country'],
      roles: ['legislatorLowerBody'],
      officialIndices: [officials.length - 1],
    });
  }
  return { officials, offices };
}

async function fetchStateFromOpenStates(lat: number, lng: number, state: string, sldu?: string, sldl?: string) {
  const KEY = (process.env.OPENSTATES_API_KEY || '').trim();
  if (!KEY) {
    functions.logger.info('OPENSTATES_API_KEY not set; skipping state representatives');
    return { officials: [], offices: [] };
  }
  const url = new URL('https://v3.openstates.org/people.geo');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lng', String(lng));
  // Don't include 'current_role' - it's not a valid include param; role data comes by default

  const resp = await fetch(url.toString(), {
    headers: { 'X-API-Key': KEY, Accept: 'application/json' },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenStates error ${resp.status}: ${text.slice(0, 300)}`);
  }

  const json = await resp.json() as any;
  const people: any[] = json?.results || [];
  const officials: any[] = [];
  const offices: any[] = [];

  // Build candidate list (do not over-filter on jurisdiction; some roles may omit or format differently)
  const candidates = people.map(p => {
    const role = p.current_role || p.currentRole || p.current_roles?.[0];
    return { person: p, role };
  }).filter(r => !!r.role);

  function matchDistrict(r: any, chamber: 'upper' | 'lower', target?: string) {
    if (!r.role) return false;
    const ch = r.role.chamber || r.role.org_classification;
    if (ch !== chamber) return false;
    if (!target) return true; // fallback if census didn't provide
    const roleDist = String(r.role.district || r.role.label || '').replace(/^0+/, '');
    const targetNorm = String(target).replace(/^0+/, '');
    return roleDist === targetNorm;
  }

  const upperLeg = candidates.find(r => matchDistrict(r, 'upper', sldu)) || candidates.find(r => matchDistrict(r, 'upper')); // fallback
  const lowerLeg = candidates.find(r => matchDistrict(r, 'lower', sldl)) || candidates.find(r => matchDistrict(r, 'lower'));

  functions.logger.info('State selection', {
    totalPeople: people.length,
    stateCandidates: candidates.length,
    upperPicked: !!upperLeg,
    lowerPicked: !!lowerLeg,
    slduTarget: sldu,
    sldlTarget: sldl,
    upperName: upperLeg ? (upperLeg as any).person.name : undefined,
    lowerName: lowerLeg ? (lowerLeg as any).person.name : undefined,
    candidateSample: candidates.slice(0,10).map(c => ({ name: c.person.name, chamber: c.role?.chamber, district: c.role?.district, jurisdiction: c.role?.jurisdiction?.id }))
  });

  for (const wrapper of [upperLeg, lowerLeg].filter(Boolean)) {
    if (!wrapper) continue;
    const p = (wrapper as any).person;
    const role = (wrapper as any).role;
    const chamber = role?.chamber || role?.org_classification;
    const officeName = chamber === 'upper' ? 'State Senator' : chamber === 'lower' ? 'State Representative' : 'State Legislator';
    officials.push({
      name: p.name || `${p.given_name || ''} ${p.family_name || ''}`.trim(),
      party: p.party || p.current_party || p.current_party_affiliations?.[0]?.name,
      phones: p.offices?.[0]?.voice ? [p.offices?.[0]?.voice] : undefined,
      urls: p.links?.[0]?.url ? [p.links?.[0]?.url] : undefined,
      photoUrl: p.image || undefined,
    });
    offices.push({
      name: officeName,
      divisionId: undefined,
      levels: ['administrativeArea1'],
      roles: [chamber === 'upper' ? 'legislatorUpperBody' : 'legislatorLowerBody'],
      officialIndices: [officials.length - 1],
    });
  }

  return { officials, offices };
}

export const representatives = functions.runWith({ secrets: ['CONGRESS_API_KEY', 'OPENSTATES_API_KEY'] }).https.onCall(async (data: { address?: string }, context: functions.https.CallableContext) => {
  const { address } = data || {};
  if (!address || typeof address !== 'string' || address.trim().length < 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid address is required');
  }

  // 1) Geocode address to lat/lng + districts
  const geo = await geocodeWithCensus(address);
  if (!geo) {
    throw new functions.https.HttpsError('failed-precondition', 'Could not geocode address');
  }
  functions.logger.info('Census geocode', geo as any);

  // 2) Fetch federal members
  let fedOfficials: any[] = []; let fedOffices: any[] = [];
  try {
    // Prefer an explicit env override. If none provided, prefer Congress.gov when we
    // have a CONGRESS_API_KEY available at runtime — this avoids using a potentially
    // corrupted local bundle as the primary source.
    const federalSource = (process.env.FEDERAL_SOURCE || (process.env.CONGRESS_API_KEY ? 'congress' : 'fallback')).toLowerCase();
    let fed;
    functions.logger.info('Selected federal source', { federalSource });
    if (federalSource === 'fallback') {
      functions.logger.info('Using fallback federal dataset');
      fed = await fetchFallbackFederal(geo.state, geo.congressional);
    } else {
      fed = await fetchFederalFromCongressGov(geo.state, geo.congressional);
      if (!fed || (fed.officials && fed.officials.length < 3)) {
        functions.logger.warn('Congress.gov returned insufficient federal members, switching to fallback', { got: fed?.officials?.length });
        fed = await fetchFallbackFederal(geo.state, geo.congressional);
      }
    }
    fedOfficials = fed.officials; fedOffices = fed.offices;
  } catch (e: any) {
    functions.logger.warn('Congress.gov fetch failed; using fallback', { error: e?.message });
    try {
      const fed = await fetchFallbackFederal(geo.state, geo.congressional);
      fedOfficials = fed.officials; fedOffices = fed.offices;
    } catch (e2: any) {
      functions.logger.warn('Fallback federal fetch failed', { error: e2?.message });
    }
  }

  // 3) Fetch state members
  let stateOfficials: any[] = []; let stateOffices: any[] = [];
  try {
  const st = await fetchStateFromOpenStates(geo.lat, geo.lng, geo.state, geo.sldu, geo.sldl);
    stateOfficials = st.officials; stateOffices = st.offices;
  } catch (e: any) {
    functions.logger.warn('OpenStates fetch failed', { error: e?.message });
  }

  const officials = [...fedOfficials, ...stateOfficials];
  // Adjust officialIndices for state offices to account for federally-added officials
  const adjustedStateOffices = stateOffices.map(o => ({
    ...o,
    officialIndices: o.officialIndices.map((i: number) => i + fedOfficials.length),
  }));
  const offices = [...fedOffices, ...adjustedStateOffices];

  functions.logger.info('Returning representatives', {
    federalCount: fedOfficials.length,
    stateCount: stateOfficials.length,
    totalCount: officials.length,
    officeNames: offices.map(o => o.name),
    officialNames: officials.map(off => off.name),
  });

  return {
    officials,
    offices,
    normalizedInput: { line1: undefined, city: undefined, state: geo.state, zip: undefined },
  };
});
