#!/usr/bin/env node
/**
 * Fetch the latest legislators-current.json from multiple mirrors and write to
 * functions/src/data/ and functions/lib/data/ so the deployed function has a
 * bundled nationwide dataset as a fallback.
 */
const fs = require('fs');
const path = require('path');

const sources = [
  'https://cdn.jsdelivr.net/gh/unitedstates/congress-legislators@main/legislators-current.json',
  'https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json',
  'https://theunitedstates.io/congress-legislators/legislators-current.json'
];

async function fetchUrl(u) {
  const res = await fetch(u, { headers: { 'User-Agent': 'refresh-script' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

async function buildFromCongressGov() {
  const API = process.env.CONGRESS_API_KEY;
  if (!API) throw new Error('CONGRESS_API_KEY is required to build dataset from Congress.gov');
  const states = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];
  const results = [];
  const seen = new Set();
  for (const st of states) {
    // Senators
    try {
      const sUrl = `https://api.congress.gov/v3/member?state=${encodeURIComponent(st)}&chamber=Senate&currentMember=true&limit=250&format=json&api_key=${API}`;
      const sResp = await fetch(sUrl);
      if (sResp.ok) {
        const sJson = await sResp.json();
        const members = sJson.members || [];
        for (const m of members) {
          const id = m.bioguideId || m.bioguide_id || (m.uri ? m.uri.split('/').pop() : undefined) || (m.name || '').replace(/\s+/g, '_');
          if (seen.has(id)) continue;
          seen.add(id);
          results.push({
            name: { official_full: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(), first: m.firstName, last: m.lastName },
            id: { bioguide: m.bioguideId || m.bioguide_id },
            roles: [{ type: 'senator', state: st, party: m.partyName || m.party, phone: m.phone, url: m.url }]
          });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch senators for', st, e.message);
    }
    // Representatives
    try {
      const rUrl = `https://api.congress.gov/v3/member?state=${encodeURIComponent(st)}&chamber=House&currentMember=true&limit=500&format=json&api_key=${API}`;
      const rResp = await fetch(rUrl);
      if (rResp.ok) {
        const rJson = await rResp.json();
        const members = rJson.members || [];
        for (const m of members) {
          const id = m.bioguideId || m.bioguide_id || (m.uri ? m.uri.split('/').pop() : undefined) || (m.name || '').replace(/\s+/g, '_');
          if (seen.has(id)) continue;
          seen.add(id);
          // try to read district from terms
          const term = (m.terms && m.terms.slice(-1)[0]) || {};
          const district = term.district || m.district;
          results.push({
            name: { official_full: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(), first: m.firstName, last: m.lastName },
            id: { bioguide: m.bioguideId || m.bioguide_id },
            roles: [{ type: 'representative', state: st, district: district ? Number(district) : undefined, party: m.partyName || m.party, phone: m.phone, url: m.url }]
          });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch reps for', st, e.message);
    }
  }
  return results;
}

async function run() {
  let lastErr = null;
  for (const url of sources) {
    try {
      console.log('Trying', url);
      const text = await fetchUrl(url);
      const data = JSON.parse(text);
      if (!Array.isArray(data) || data.length < 300) {
        throw new Error('Downloaded data seems too small');
      }
      // Write to src/data and lib/data for runtime and source
      const outDirSrc = path.join(__dirname, '..', 'src', 'data');
      const outDirLib = path.join(__dirname, '..', 'lib', 'data');
      if (!fs.existsSync(outDirSrc)) fs.mkdirSync(outDirSrc, { recursive: true });
      if (!fs.existsSync(outDirLib)) fs.mkdirSync(outDirLib, { recursive: true });
      const outPathSrc = path.join(outDirSrc, 'legislators-current.json');
      const outPathLib = path.join(outDirLib, 'legislators-current.json');
      fs.writeFileSync(outPathSrc, JSON.stringify(data, null, 2), { encoding: 'utf8' });
      fs.writeFileSync(outPathLib, JSON.stringify(data, null, 2), { encoding: 'utf8' });
      console.log('Wrote legislators to', outPathSrc, 'and', outPathLib, 'count=', data.length);
      return;
    } catch (e) {
      console.warn('Failed to fetch', url, e.message);
      lastErr = e;
    }
  }

  console.warn('All remote sources failed; attempting to build from Congress.gov API using CONGRESS_API_KEY if available');
  try {
    const built = await buildFromCongressGov();
    if (!Array.isArray(built) || built.length === 0) throw new Error('Congress.gov build returned no data');
    const outDirSrc = path.join(__dirname, '..', 'src', 'data');
    const outDirLib = path.join(__dirname, '..', 'lib', 'data');
    if (!fs.existsSync(outDirSrc)) fs.mkdirSync(outDirSrc, { recursive: true });
    if (!fs.existsSync(outDirLib)) fs.mkdirSync(outDirLib, { recursive: true });
    const outPathSrc = path.join(outDirSrc, 'legislators-current.json');
    const outPathLib = path.join(outDirLib, 'legislators-current.json');
    fs.writeFileSync(outPathSrc, JSON.stringify(built, null, 2), { encoding: 'utf8' });
    fs.writeFileSync(outPathLib, JSON.stringify(built, null, 2), { encoding: 'utf8' });
    console.log('Built and wrote legislators from Congress.gov to', outPathSrc, 'count=', built.length);
    return;
  } catch (e) {
    console.error('Failed to build from Congress.gov:', e.message);
    process.exit(1);
  }
}

// Node 18+ has global fetch
run().catch(e => { console.error(e); process.exit(1); });
