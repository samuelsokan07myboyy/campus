import berkeleySeal from '@/assets/images/berkeley-seal.png';
import templeBlockT from '@/assets/images/temple-t-logo.png';
import uclaSeal from '@/assets/images/ucla-seal.png';
import uscSeal from '@/assets/images/usc-seal.png';

// Re-export JSX components from components/CollegeLogo.tsx
export { CollegeLogo, SchoolLogo } from '@/components/CollegeLogo';

// ─── School brand palette ──────────────────────────────────────────────────
export type SchoolBrand = {
  short: string;
  color: string;
  accent: string;
  logo?: string | number;
  logoBackground?: string;
  logoBorder?: string;
};

export const SCHOOL_BRANDS: Record<string, SchoolBrand> = {
  // ── UC / USC ────────────────────────────────────────────────────────────
  ucla:                                   { short: 'UCLA',  color: '#2774AE', accent: '#FFD100', logo: uclaSeal,      logoBackground: '#2774AE', logoBorder: '#FFD100' },
  'university of california los angeles': { short: 'UCLA',  color: '#2774AE', accent: '#FFD100', logo: uclaSeal,      logoBackground: '#2774AE', logoBorder: '#FFD100' },
  usc:                                    { short: 'USC',   color: '#990000', accent: '#FFC72C', logo: uscSeal,       logoBackground: '#990000', logoBorder: '#FFC72C' },
  'university of southern california':    { short: 'USC',   color: '#990000', accent: '#FFC72C', logo: uscSeal,       logoBackground: '#990000', logoBorder: '#FFC72C' },

  // ── Temple ─────────────────────────────────────────────────────────────
  temple:                                 { short: 'TU',    color: '#A41E34', accent: '#FFFFFF', logo: templeBlockT,  logoBackground: '#A41E34', logoBorder: '#FFFFFF' },
  'temple university':                    { short: 'TU',    color: '#A41E34', accent: '#FFFFFF', logo: templeBlockT,  logoBackground: '#A41E34', logoBorder: '#FFFFFF' },

  // ── Berkeley ────────────────────────────────────────────────────────────
  berkeley:                               { short: 'B',     color: '#003262', accent: '#FDB515', logo: berkeleySeal,  logoBackground: '#003262', logoBorder: '#FDB515' },
  'uc berkeley':                          { short: 'B',     color: '#003262', accent: '#FDB515', logo: berkeleySeal,  logoBackground: '#003262', logoBorder: '#FDB515' },
  'university of california berkeley':    { short: 'B',     color: '#003262', accent: '#FDB515', logo: berkeleySeal,  logoBackground: '#003262', logoBorder: '#FDB515' },

  // ── Ivy League ──────────────────────────────────────────────────────────
  harvard:                                { short: 'H',     color: '#A51C30', accent: '#FFFFFF' },
  'harvard university':                   { short: 'H',     color: '#A51C30', accent: '#FFFFFF' },
  yale:                                   { short: 'Y',     color: '#0F4D92', accent: '#FFFFFF' },
  'yale university':                      { short: 'Y',     color: '#0F4D92', accent: '#FFFFFF' },
  stanford:                               { short: 'S',     color: '#8C1515', accent: '#FFFFFF' },
  'stanford university':                  { short: 'S',     color: '#8C1515', accent: '#FFFFFF' },
  princeton:                              { short: 'P',     color: '#E77500', accent: '#FFFFFF' },
  'princeton university':                 { short: 'P',     color: '#E77500', accent: '#FFFFFF' },
  columbia:                               { short: 'C',     color: '#9D2235', accent: '#FFFFFF' },
  'columbia university':                  { short: 'C',     color: '#9D2235', accent: '#FFFFFF' },
  cornell:                                { short: 'C',     color: '#B31B1B', accent: '#FFFFFF' },
  'cornell university':                   { short: 'C',     color: '#B31B1B', accent: '#FFFFFF' },
  brown:                                  { short: 'B',     color: '#4E3629', accent: '#FFFFFF' },
  'brown university':                     { short: 'B',     color: '#4E3629', accent: '#FFFFFF' },
  dartmouth:                              { short: 'D',     color: '#00693E', accent: '#FFFFFF' },
  'dartmouth college':                    { short: 'D',     color: '#00693E', accent: '#FFFFFF' },

  // ── Top Private ─────────────────────────────────────────────────────────
  mit:                                    { short: 'MIT',   color: '#A31F34', accent: '#FFFFFF' },
  'massachusetts institute of technology':{ short: 'MIT',   color: '#A31F34', accent: '#FFFFFF' },
  duke:                                   { short: 'D',     color: '#001A57', accent: '#C84E00' },
  'duke university':                      { short: 'D',     color: '#001A57', accent: '#C84E00' },
  penn:                                   { short: 'P',     color: '#011F5B', accent: '#C5B783' },
  upenn:                                  { short: 'P',     color: '#011F5B', accent: '#C5B783' },
  'university of pennsylvania':           { short: 'UPenn', color: '#011F5B', accent: '#C5B783' },
  northwestern:                           { short: 'NU',    color: '#4E2A84', accent: '#FFFFFF' },
  'northwestern university':              { short: 'NU',    color: '#4E2A84', accent: '#FFFFFF' },
  nyu:                                    { short: 'NYU',   color: '#57068C', accent: '#FFFFFF' },
  'new york university':                  { short: 'NYU',   color: '#57068C', accent: '#FFFFFF' },
  cmu:                                    { short: 'CMU',   color: '#C41230', accent: '#FFFFFF' },
  'carnegie mellon':                      { short: 'CMU',   color: '#C41230', accent: '#FFFFFF' },
  'carnegie mellon university':           { short: 'CMU',   color: '#C41230', accent: '#FFFFFF' },
  georgetown:                             { short: 'GU',    color: '#041E42', accent: '#FFFFFF' },
  'georgetown university':                { short: 'GU',    color: '#041E42', accent: '#FFFFFF' },
  vanderbilt:                             { short: 'VU',    color: '#866D4B', accent: '#FFFFFF' },
  'vanderbilt university':                { short: 'VU',    color: '#866D4B', accent: '#FFFFFF' },

  // ── State Flagships ─────────────────────────────────────────────────────
  'penn state':                           { short: 'PSU',   color: '#1E407C', accent: '#FFFFFF' },
  psu:                                    { short: 'PSU',   color: '#1E407C', accent: '#FFFFFF' },
  'pennsylvania state university':        { short: 'PSU',   color: '#1E407C', accent: '#FFFFFF' },
  umich:                                  { short: 'UM',    color: '#00274C', accent: '#FFCB05' },
  'university of michigan':               { short: 'UM',    color: '#00274C', accent: '#FFCB05' },
  'ohio state':                           { short: 'OSU',   color: '#BB0000', accent: '#FFFFFF' },
  osu:                                    { short: 'OSU',   color: '#BB0000', accent: '#FFFFFF' },
  'georgia tech':                         { short: 'GT',    color: '#003057', accent: '#B3A369' },
  gatech:                                 { short: 'GT',    color: '#003057', accent: '#B3A369' },
  unc:                                    { short: 'UNC',   color: '#4B9CD3', accent: '#FFFFFF' },
  'unc chapel hill':                      { short: 'UNC',   color: '#4B9CD3', accent: '#FFFFFF' },
  uva:                                    { short: 'UVA',   color: '#232D4B', accent: '#E57200' },
  'university of virginia':               { short: 'UVA',   color: '#232D4B', accent: '#E57200' },
  uf:                                     { short: 'UF',    color: '#0021A5', accent: '#FA4616' },
  'university of florida':                { short: 'UF',    color: '#0021A5', accent: '#FA4616' },
  fsu:                                    { short: 'FSU',   color: '#782F40', accent: '#CEB888' },
  'florida state':                        { short: 'FSU',   color: '#782F40', accent: '#CEB888' },
  'florida state university':             { short: 'FSU',   color: '#782F40', accent: '#CEB888' },
  asu:                                    { short: 'ASU',   color: '#8C1D40', accent: '#FFC627' },
  'arizona state':                        { short: 'ASU',   color: '#8C1D40', accent: '#FFC627' },
  'arizona state university':             { short: 'ASU',   color: '#8C1D40', accent: '#FFC627' },
  alabama:                                { short: 'UA',    color: '#9E1B32', accent: '#FFFFFF' },
  'university of alabama':                { short: 'UA',    color: '#9E1B32', accent: '#FFFFFF' },
  'virginia tech':                        { short: 'VT',    color: '#861F41', accent: '#E5751F' },
  vt:                                     { short: 'VT',    color: '#861F41', accent: '#E5751F' },
  purdue:                                 { short: 'PU',    color: '#CEB888', accent: '#000000' },
  'purdue university':                    { short: 'PU',    color: '#CEB888', accent: '#000000' },
  rutgers:                                { short: 'RU',    color: '#CC0033', accent: '#FFFFFF' },
  'rutgers university':                   { short: 'RU',    color: '#CC0033', accent: '#FFFFFF' },
  drexel:                                 { short: 'DU',    color: '#07294D', accent: '#FFCC00' },
  'drexel university':                    { short: 'DU',    color: '#07294D', accent: '#FFCC00' },
  villanova:                              { short: 'VU',    color: '#003E7E', accent: '#FFFFFF' },
  'villanova university':                 { short: 'VU',    color: '#003E7E', accent: '#FFFFFF' },

  // ── HBCUs ───────────────────────────────────────────────────────────────
  howard:                                 { short: 'HU',    color: '#003A63', accent: '#E51937' },
  'howard university':                    { short: 'HU',    color: '#003A63', accent: '#E51937' },
  spelman:                                { short: 'SC',    color: '#003DA5', accent: '#FFFFFF' },
  'spelman college':                      { short: 'SC',    color: '#003DA5', accent: '#FFFFFF' },
  morehouse:                              { short: 'MC',    color: '#7A0000', accent: '#FFFFFF' },
  'morehouse college':                    { short: 'MC',    color: '#7A0000', accent: '#FFFFFF' },
  famu:                                   { short: 'FAMU',  color: '#006633', accent: '#FF8200' },
  'florida a&m':                          { short: 'FAMU',  color: '#006633', accent: '#FF8200' },

  // ── International ───────────────────────────────────────────────────────
  oxford:                                 { short: 'OX',    color: '#002147', accent: '#FFFFFF' },
  'university of oxford':                 { short: 'OX',    color: '#002147', accent: '#FFFFFF' },
  cambridge:                              { short: 'CAM',   color: '#A3C1AD', accent: '#002147' },
  'university of cambridge':              { short: 'CAM',   color: '#A3C1AD', accent: '#002147' },
  utoronto:                               { short: 'UoT',   color: '#002A5C', accent: '#FFFFFF' },
  'university of toronto':                { short: 'UoT',   color: '#002A5C', accent: '#FFFFFF' },
  mcgill:                                 { short: 'MG',    color: '#ED1B2F', accent: '#FFFFFF' },
  'mcgill university':                    { short: 'MG',    color: '#ED1B2F', accent: '#FFFFFF' },
};

// ─── Brand resolver ───────────────────────────────────────────────────────
export function getSchoolBrand(name?: string): SchoolBrand {
  const normalized = (name ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  if (!normalized) {
    return { short: 'U', color: '#475569', accent: '#F8FAFC' };
  }

  const direct = Object.entries(SCHOOL_BRANDS).find(
    ([school]) => normalized.includes(school.replace(/[^a-z0-9]+/g, ' ').trim()),
  );
  if (direct) return direct[1];

  const words = normalized.split(/[\s&-]+/).filter(Boolean);
  const short = words
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3) || 'U';

  return { short, color: '#475569', accent: '#F8FAFC' };
}
