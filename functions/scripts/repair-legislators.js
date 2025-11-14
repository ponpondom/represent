#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'repair-script' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

async function run() {
  const API = process.env.CONGRESS_API_KEY;
  if (!API) {
    console.error('CONGRESS_API_KEY required in environment');
    process.exit(1);
  }

  const inPathLib = path.join(__dirname, '..', 'lib', 'data', 'legislators-current.json');
  const inPathSrc = path.join(__dirname, '..', 'src', 'data', 'legislators-current.json');
  const inPath = fs.existsSync(inPathSrc) ? inPathSrc : inPathLib;
  if (!fs.existsSync(inPath)) {
    console.error('No input legislators file found at', inPathSrc, 'or', inPathLib);
    process.exit(1);
  }

  const raw = fs.readFileSync(inPath, 'utf8');
  const data = JSON.parse(raw);
  console.log('Loaded', data.length, 'entries from', inPath);

  const base = 'https://api.congress.gov/v3/member';
  let fixed = 0;
  for (let i = 0; i < data.length; i++) {
    const person = data[i];
    const bioguide = person && person.id && person.id.bioguide;
    if (!bioguide) continue;
    // Heuristic: if any role.state is missing or all roles are 'AL' (broken), attempt repair
    const roles = person.roles || [];
    const states = Array.from(new Set(roles.map(r => r && r.state).filter(Boolean)));
    const needsRepair = states.length === 0 || (states.length === 1 && states[0] === 'AL');
    if (!needsRepair) continue;

    try {
      const url = `${base}?bioguide=${encodeURIComponent(bioguide)}&format=json&api_key=${API}`;
      const json = await fetchJson(url);
      const members = json && json.members ? json.members : [];
      if (!members.length) {
        console.warn('No member data for', bioguide);
        continue;
      }
      const m = members[0];
      // Congress.gov may return 'terms' as an array, an object, or as { item: [...] }
      let terms = [];
      if (Array.isArray(m.terms)) {
        terms = m.terms;
      } else if (m.terms && Array.isArray(m.terms.item)) {
        terms = m.terms.item;
      } else if (m.terms && m.terms.item) {
        terms = [m.terms.item];
      } else if (m.terms) {
        terms = [m.terms];
      } else {
        terms = [];
      }
      // Build roles array from latest terms
      const newRoles = [];
      for (let t of terms) {
        if (!t || !t.chamber) continue;
        const chamber = (t.chamber || '').toLowerCase();
        if (chamber.includes('senate')) {
          newRoles.push({ type: 'senator', state: t.state || t.stateCode || undefined, party: t.party || m.party, phone: t.phone, url: t.url });
        } else if (chamber.includes('house')) {
          newRoles.push({ type: 'representative', state: t.state || t.stateCode || undefined, district: t.district || undefined, party: t.party || m.party, phone: t.phone, url: t.url });
        }
      }
      if (newRoles.length) {
        person.roles = newRoles;
        fixed++;
        if (fixed % 25 === 0) console.log('Fixed', fixed, 'so far...');
      } else {
        console.warn('No roles built for', bioguide);
      }
    } catch (e) {
      console.warn('Failed to fetch member', bioguide, e.message);
    }
  }

  // Write updated file to both src/data and lib/data
  const outSrc = path.join(__dirname, '..', 'src', 'data', 'legislators-current.json');
  const outLib = path.join(__dirname, '..', 'lib', 'data', 'legislators-current.json');
  if (!fs.existsSync(path.dirname(outSrc))) fs.mkdirSync(path.dirname(outSrc), { recursive: true });
  if (!fs.existsSync(path.dirname(outLib))) fs.mkdirSync(path.dirname(outLib), { recursive: true });
  fs.writeFileSync(outSrc, JSON.stringify(data, null, 2), 'utf8');
  fs.writeFileSync(outLib, JSON.stringify(data, null, 2), 'utf8');
  console.log('Wrote repaired dataset. Fixed entries:', fixed, 'Total entries:', data.length);
}

run().catch(e => { console.error(e); process.exit(1); });
