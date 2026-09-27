/**
 * Lightweight College & University Logo Resolver
 * Uses Google free Favicon/Crest CDN (s2/favicons) — zero backend required.
 */

export interface CollegeInfo {
  name: string;
  domain: string;
  logoUrl: string;
}

const COLLEGE_MAP: Record<string, { name: string; domain: string }> = {
  // Ivy League
  'harvard': { name: 'Harvard University', domain: 'harvard.edu' },
  'harvard university': { name: 'Harvard University', domain: 'harvard.edu' },
  'yale': { name: 'Yale University', domain: 'yale.edu' },
  'yale university': { name: 'Yale University', domain: 'yale.edu' },
  'princeton': { name: 'Princeton University', domain: 'princeton.edu' },
  'princeton university': { name: 'Princeton University', domain: 'princeton.edu' },
  'columbia': { name: 'Columbia University', domain: 'columbia.edu' },
  'columbia university': { name: 'Columbia University', domain: 'columbia.edu' },
  'brown': { name: 'Brown University', domain: 'brown.edu' },
  'brown university': { name: 'Brown University', domain: 'brown.edu' },
  'dartmouth': { name: 'Dartmouth College', domain: 'dartmouth.edu' },
  'dartmouth college': { name: 'Dartmouth College', domain: 'dartmouth.edu' },
  'cornell': { name: 'Cornell University', domain: 'cornell.edu' },
  'cornell university': { name: 'Cornell University', domain: 'cornell.edu' },
  'upenn': { name: 'University of Pennsylvania', domain: 'upenn.edu' },
  'penn': { name: 'University of Pennsylvania', domain: 'upenn.edu' },
  'university of pennsylvania': { name: 'University of Pennsylvania', domain: 'upenn.edu' },

  // Top Tech & Private
  'stanford': { name: 'Stanford University', domain: 'stanford.edu' },
  'stanford university': { name: 'Stanford University', domain: 'stanford.edu' },
  'mit': { name: 'MIT', domain: 'mit.edu' },
  'massachusetts institute of technology': { name: 'MIT', domain: 'mit.edu' },
  'caltech': { name: 'Caltech', domain: 'caltech.edu' },
  'california institute of technology': { name: 'Caltech', domain: 'caltech.edu' },
  'nyu': { name: 'New York University', domain: 'nyu.edu' },
  'new york university': { name: 'New York University', domain: 'nyu.edu' },
  'usc': { name: 'USC', domain: 'usc.edu' },
  'university of southern california': { name: 'USC', domain: 'usc.edu' },
  'duke': { name: 'Duke University', domain: 'duke.edu' },
  'duke university': { name: 'Duke University', domain: 'duke.edu' },
  'northwestern': { name: 'Northwestern University', domain: 'northwestern.edu' },
  'northwestern university': { name: 'Northwestern University', domain: 'northwestern.edu' },
  'uchicago': { name: 'University of Chicago', domain: 'uchicago.edu' },
  'university of chicago': { name: 'University of Chicago', domain: 'uchicago.edu' },
  'jhu': { name: 'Johns Hopkins University', domain: 'jhu.edu' },
  'johns hopkins': { name: 'Johns Hopkins University', domain: 'jhu.edu' },
  'johns hopkins university': { name: 'Johns Hopkins University', domain: 'jhu.edu' },
  'georgetown': { name: 'Georgetown University', domain: 'georgetown.edu' },
  'georgetown university': { name: 'Georgetown University', domain: 'georgetown.edu' },
  'vanderbilt': { name: 'Vanderbilt University', domain: 'vanderbilt.edu' },
  'vanderbilt university': { name: 'Vanderbilt University', domain: 'vanderbilt.edu' },
  'cmu': { name: 'Carnegie Mellon University', domain: 'cmu.edu' },
  'carnegie mellon': { name: 'Carnegie Mellon University', domain: 'cmu.edu' },
  'carnegie mellon university': { name: 'Carnegie Mellon University', domain: 'cmu.edu' },
  'emory': { name: 'Emory University', domain: 'emory.edu' },
  'emory university': { name: 'Emory University', domain: 'emory.edu' },
  'rice': { name: 'Rice University', domain: 'rice.edu' },
  'rice university': { name: 'Rice University', domain: 'rice.edu' },
  'tufts': { name: 'Tufts University', domain: 'tufts.edu' },
  'tufts university': { name: 'Tufts University', domain: 'tufts.edu' },
  'wustl': { name: 'Washington University in St. Louis', domain: 'wustl.edu' },
  'washu': { name: 'Washington University in St. Louis', domain: 'wustl.edu' },
  'wake forest': { name: 'Wake Forest University', domain: 'wfu.edu' },

  // UC System
  'ucla': { name: 'UCLA', domain: 'ucla.edu' },
  'university of california los angeles': { name: 'UCLA', domain: 'ucla.edu' },
  'uc berkeley': { name: 'UC Berkeley', domain: 'berkeley.edu' },
  'berkeley': { name: 'UC Berkeley', domain: 'berkeley.edu' },
  'cal': { name: 'UC Berkeley', domain: 'berkeley.edu' },
  'university of california berkeley': { name: 'UC Berkeley', domain: 'berkeley.edu' },
  'ucsd': { name: 'UC San Diego', domain: 'ucsd.edu' },
  'uc san diego': { name: 'UC San Diego', domain: 'ucsd.edu' },
  'university of california san diego': { name: 'UC San Diego', domain: 'ucsd.edu' },
  'ucsb': { name: 'UC Santa Barbara', domain: 'ucsb.edu' },
  'uc santa barbara': { name: 'UC Santa Barbara', domain: 'ucsb.edu' },
  'uci': { name: 'UC Irvine', domain: 'uci.edu' },
  'uc irvine': { name: 'UC Irvine', domain: 'uci.edu' },
  'ucr': { name: 'UC Riverside', domain: 'ucr.edu' },
  'ucsc': { name: 'UC Santa Cruz', domain: 'ucsc.edu' },
  'ucd': { name: 'UC Davis', domain: 'ucdavis.edu' },
  'uc davis': { name: 'UC Davis', domain: 'ucdavis.edu' },

  // State Flagships
  'umich': { name: 'University of Michigan', domain: 'umich.edu' },
  'university of michigan': { name: 'University of Michigan', domain: 'umich.edu' },
  'ut austin': { name: 'UT Austin', domain: 'utexas.edu' },
  'utexas': { name: 'UT Austin', domain: 'utexas.edu' },
  'university of texas': { name: 'UT Austin', domain: 'utexas.edu' },
  'uf': { name: 'University of Florida', domain: 'ufl.edu' },
  'university of florida': { name: 'University of Florida', domain: 'ufl.edu' },
  'georgia tech': { name: 'Georgia Tech', domain: 'gatech.edu' },
  'gatech': { name: 'Georgia Tech', domain: 'gatech.edu' },
  'uga': { name: 'University of Georgia', domain: 'uga.edu' },
  'university of georgia': { name: 'University of Georgia', domain: 'uga.edu' },
  'unc': { name: 'UNC Chapel Hill', domain: 'unc.edu' },
  'unc chapel hill': { name: 'UNC Chapel Hill', domain: 'unc.edu' },
  'university of north carolina': { name: 'UNC Chapel Hill', domain: 'unc.edu' },
  'uva': { name: 'University of Virginia', domain: 'virginia.edu' },
  'university of virginia': { name: 'University of Virginia', domain: 'virginia.edu' },
  'penn state': { name: 'Penn State', domain: 'psu.edu' },
  'psu': { name: 'Penn State', domain: 'psu.edu' },
  'pennsylvania state university': { name: 'Penn State', domain: 'psu.edu' },
  'ohio state': { name: 'Ohio State', domain: 'osu.edu' },
  'osu': { name: 'Ohio State', domain: 'osu.edu' },
  'the ohio state university': { name: 'Ohio State', domain: 'osu.edu' },
  'asu': { name: 'Arizona State University', domain: 'asu.edu' },
  'arizona state': { name: 'Arizona State University', domain: 'asu.edu' },
  'arizona state university': { name: 'Arizona State University', domain: 'asu.edu' },
  'bama': { name: 'University of Alabama', domain: 'ua.edu' },
  'alabama': { name: 'University of Alabama', domain: 'ua.edu' },
  'university of alabama': { name: 'University of Alabama', domain: 'ua.edu' },
  'fsu': { name: 'Florida State University', domain: 'fsu.edu' },
  'florida state': { name: 'Florida State University', domain: 'fsu.edu' },
  'florida state university': { name: 'Florida State University', domain: 'fsu.edu' },
  'lsu': { name: 'Louisiana State University', domain: 'lsu.edu' },
  'louisiana state university': { name: 'Louisiana State University', domain: 'lsu.edu' },
  'university of washington': { name: 'University of Washington', domain: 'uw.edu' },
  'uw': { name: 'University of Washington', domain: 'uw.edu' },
  'purdue': { name: 'Purdue University', domain: 'purdue.edu' },
  'purdue university': { name: 'Purdue University', domain: 'purdue.edu' },
  'university of illinois': { name: 'UIUC', domain: 'illinois.edu' },
  'uiuc': { name: 'UIUC', domain: 'illinois.edu' },
  'university of minnesota': { name: 'University of Minnesota', domain: 'umn.edu' },
  'umn': { name: 'University of Minnesota', domain: 'umn.edu' },
  'university of colorado': { name: 'CU Boulder', domain: 'colorado.edu' },
  'cu boulder': { name: 'CU Boulder', domain: 'colorado.edu' },
  'rutgers': { name: 'Rutgers University', domain: 'rutgers.edu' },
  'rutgers university': { name: 'Rutgers University', domain: 'rutgers.edu' },
  'university of maryland': { name: 'University of Maryland', domain: 'umd.edu' },
  'umd': { name: 'University of Maryland', domain: 'umd.edu' },
  'uconn': { name: 'University of Connecticut', domain: 'uconn.edu' },
  'university of connecticut': { name: 'University of Connecticut', domain: 'uconn.edu' },
  'nc state': { name: 'NC State', domain: 'ncsu.edu' },
  'ncsu': { name: 'NC State', domain: 'ncsu.edu' },
  'vt': { name: 'Virginia Tech', domain: 'vt.edu' },
  'virginia tech': { name: 'Virginia Tech', domain: 'vt.edu' },
  'university of pittsburgh': { name: 'University of Pittsburgh', domain: 'pitt.edu' },
  'pitt': { name: 'University of Pittsburgh', domain: 'pitt.edu' },
  'michigan state': { name: 'Michigan State University', domain: 'msu.edu' },
  'msu': { name: 'Michigan State University', domain: 'msu.edu' },
  'indiana university': { name: 'Indiana University', domain: 'iu.edu' },
  'iu': { name: 'Indiana University', domain: 'iu.edu' },
  'university of arizona': { name: 'University of Arizona', domain: 'arizona.edu' },
  'uarizona': { name: 'University of Arizona', domain: 'arizona.edu' },
  'university of utah': { name: 'University of Utah', domain: 'utah.edu' },
  'utah': { name: 'University of Utah', domain: 'utah.edu' },
  'iowa state': { name: 'Iowa State University', domain: 'iastate.edu' },
  'university of iowa': { name: 'University of Iowa', domain: 'uiowa.edu' },
  'ku': { name: 'University of Kansas', domain: 'ku.edu' },
  'university of kansas': { name: 'University of Kansas', domain: 'ku.edu' },

  // Temple / Philadelphia
  'temple': { name: 'Temple University', domain: 'temple.edu' },
  'temple university': { name: 'Temple University', domain: 'temple.edu' },
  'drexel': { name: 'Drexel University', domain: 'drexel.edu' },
  'drexel university': { name: 'Drexel University', domain: 'drexel.edu' },
  'villanova': { name: 'Villanova University', domain: 'villanova.edu' },
  'villanova university': { name: 'Villanova University', domain: 'villanova.edu' },
  'la salle': { name: 'La Salle University', domain: 'lasalle.edu' },

  // HBCUs
  'howard': { name: 'Howard University', domain: 'howard.edu' },
  'howard university': { name: 'Howard University', domain: 'howard.edu' },
  'spelman': { name: 'Spelman College', domain: 'spelman.edu' },
  'spelman college': { name: 'Spelman College', domain: 'spelman.edu' },
  'morehouse': { name: 'Morehouse College', domain: 'morehouse.edu' },
  'morehouse college': { name: 'Morehouse College', domain: 'morehouse.edu' },
  'famu': { name: 'Florida A&M University', domain: 'famu.edu' },
  'tuskegee': { name: 'Tuskegee University', domain: 'tuskegee.edu' },
  'hampton university': { name: 'Hampton University', domain: 'hamptonu.edu' },
  'hampton': { name: 'Hampton University', domain: 'hamptonu.edu' },
  'north carolina a&t': { name: 'NC A&T', domain: 'ncat.edu' },
  'ncat': { name: 'NC A&T', domain: 'ncat.edu' },

  // Liberal Arts
  'amherst': { name: 'Amherst College', domain: 'amherst.edu' },
  'amherst college': { name: 'Amherst College', domain: 'amherst.edu' },
  'williams': { name: 'Williams College', domain: 'williams.edu' },
  'williams college': { name: 'Williams College', domain: 'williams.edu' },
  'wellesley': { name: 'Wellesley College', domain: 'wellesley.edu' },
  'pomona': { name: 'Pomona College', domain: 'pomona.edu' },
  'swarthmore': { name: 'Swarthmore College', domain: 'swarthmore.edu' },
  'middlebury': { name: 'Middlebury College', domain: 'middlebury.edu' },
  'bowdoin': { name: 'Bowdoin College', domain: 'bowdoin.edu' },
  'colgate': { name: 'Colgate University', domain: 'colgate.edu' },
  'lafayette': { name: 'Lafayette College', domain: 'lafayette.edu' },
  'lehigh': { name: 'Lehigh University', domain: 'lehigh.edu' },
  'bucknell': { name: 'Bucknell University', domain: 'bucknell.edu' },

  // International
  'oxford': { name: 'University of Oxford', domain: 'ox.ac.uk' },
  'university of oxford': { name: 'University of Oxford', domain: 'ox.ac.uk' },
  'cambridge': { name: 'University of Cambridge', domain: 'cam.ac.uk' },
  'university of cambridge': { name: 'University of Cambridge', domain: 'cam.ac.uk' },
  'lse': { name: 'London School of Economics', domain: 'lse.ac.uk' },
  'imperial college': { name: 'Imperial College London', domain: 'imperial.ac.uk' },
  'ucl': { name: 'UCL', domain: 'ucl.ac.uk' },
  'edinburgh': { name: 'University of Edinburgh', domain: 'ed.ac.uk' },
  'university of edinburgh': { name: 'University of Edinburgh', domain: 'ed.ac.uk' },
  'utoronto': { name: 'University of Toronto', domain: 'utoronto.ca' },
  'university of toronto': { name: 'University of Toronto', domain: 'utoronto.ca' },
  'mcgill': { name: 'McGill University', domain: 'mcgill.ca' },
  'mcgill university': { name: 'McGill University', domain: 'mcgill.ca' },
  'ubc': { name: 'UBC', domain: 'ubc.ca' },
  'university of british columbia': { name: 'UBC', domain: 'ubc.ca' },
  'nus': { name: 'National University of Singapore', domain: 'nus.edu.sg' },
  'ntu': { name: 'Nanyang Technological University', domain: 'ntu.edu.sg' },
};

const DOMAIN_MAP: Record<string, { name: string; domain: string }> = {};
for (const value of Object.values(COLLEGE_MAP)) {
  if (!DOMAIN_MAP[value.domain]) {
    DOMAIN_MAP[value.domain] = value;
  }
}

function buildLogoUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function getCollegeInfo(input?: string | null): CollegeInfo | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Raw domain check (e.g. "harvard.edu")
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    const domain = trimmed.toLowerCase();
    const known = DOMAIN_MAP[domain];
    return { name: known?.name ?? trimmed, domain, logoUrl: buildLogoUrl(domain) };
  }

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Exact match
  if (COLLEGE_MAP[normalized]) {
    const item = COLLEGE_MAP[normalized];
    return { name: item.name, domain: item.domain, logoUrl: buildLogoUrl(item.domain) };
  }

  // 3. Starts-with / ends-with / whole-word match
  for (const [key, item] of Object.entries(COLLEGE_MAP)) {
    if (key.length < 3) continue;
    if (
      normalized === key ||
      normalized.startsWith(key + ' ') ||
      normalized.endsWith(' ' + key) ||
      normalized.includes(' ' + key + ' ')
    ) {
      return { name: item.name, domain: item.domain, logoUrl: buildLogoUrl(item.domain) };
    }
  }

  // 4. Best-effort slug fallback -> <slug>.edu
  const slug = normalized
    .replace(/\buniversity\b|\bcollege\b|\binstitute\b|\bof\b|\bthe\b|\bat\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (slug.length > 2) {
    const guessedDomain = `${slug}.edu`;
    return { name: trimmed, domain: guessedDomain, logoUrl: buildLogoUrl(guessedDomain) };
  }

  return null;
}

export function resolveColleges(inputs: string[]): Record<string, CollegeInfo | null> {
  return Object.fromEntries(inputs.map((s) => [s, getCollegeInfo(s)]));
}

export function isKnownCollege(input?: string | null): boolean {
  if (!input) return false;
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Boolean(COLLEGE_MAP[normalized]);
}
