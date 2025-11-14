import { app } from '@/providers/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

export type CivicOfficial = {
  name: string;
  party?: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
};

export type CivicOffice = {
  name: string; // e.g., 'United States Senator'
  divisionId: string;
  levels?: string[];
  roles?: string[]; // e.g., ['legislatorUpperBody']
  officialIndices: number[];
};

export type Representative = CivicOfficial & { office: string };

type CivicResponse = {
  offices?: CivicOffice[];
  officials?: CivicOfficial[];
  normalizedInput?: {
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  error?: { code: number; message: string; status?: string };
};

// Filters for federal legislators (Senate + House)
const ROLE_UPPER = 'legislatorUpperBody';
const ROLE_LOWER = 'legislatorLowerBody';

export async function getRepresentativesByAddress(address: string): Promise<{
  representatives: Representative[];
  normalizedAddress?: string;
}> {
  // Always call the Firebase Cloud Function proxy (Google Civic turned down for reps; avoid accidental overinclusion)
  const functions = getFunctions(app);
  const callable = httpsCallable(functions, 'representatives');
  const result = await callable({ address });
  const json = result.data as CivicResponse;
  return mapCivicResponse(json);
}

function mapCivicResponse(json: CivicResponse): { representatives: Representative[]; normalizedAddress?: string } {
  const offices = json.offices ?? [];
  const officials = json.officials ?? [];

  const reps: Representative[] = [];
  const seen = new Set<string>(); // dedupe by office+name
  for (const office of offices) {
    const roles = office.roles || [];
    // Include only legislators at federal (country) and state (administrativeArea1) levels
    const isLegislator = roles.includes(ROLE_UPPER) || roles.includes(ROLE_LOWER);
    const levels = (office.levels || []).map(l => l.toLowerCase());
    const allowedLevel = levels.includes('country') || levels.includes('administrativearea1');
    if (!isLegislator || !allowedLevel) continue;
    for (const idx of office.officialIndices) {
      const official = officials[idx];
      if (!official) continue;
      const key = `${office.name}|${official.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      reps.push({
        office: office.name,
        name: official.name,
        party: official.party,
        phones: official.phones,
        urls: official.urls,
        photoUrl: official.photoUrl,
      });
    }
  }

  const ni = json.normalizedInput;
  const normalizedAddress = ni
    ? [ni.line1, ni.city, ni.state, ni.zip].filter(Boolean).join(', ')
    : undefined;

  return { representatives: reps, normalizedAddress };
}
