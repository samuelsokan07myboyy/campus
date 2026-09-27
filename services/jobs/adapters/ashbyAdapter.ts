import { Job, EmploymentType, WorkplaceType, JobIndustry } from '../types/Job';
import { cleanHtml } from './greenhouseAdapter';

export interface RawAshbyJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  secondaryLocations?: string[];
  publishedAt?: string;
  isRemote?: boolean;
  workplaceType?: string;
  address?: {
    postalAddress?: {
      addressRegion?: string;
      addressCountry?: string;
    };
  };
  jobUrl: string;
  applyUrl?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
}

export interface AshbyOrgConfig {
  org: string;
  displayName: string;
  color: string;
  domain: string;
  industry: JobIndustry;
}

const buildLogoUrl = (domain: string) =>
  `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;

export const ASHBY_ORGS: AshbyOrgConfig[] = [
  // AI Labs (API-verified active)
  { org: 'openai', displayName: 'OpenAI', color: '#10A37F', domain: 'openai.com', industry: 'tech' },
  { org: 'perplexity', displayName: 'Perplexity AI', color: '#20808D', domain: 'perplexity.ai', industry: 'tech' },
  { org: 'cursor', displayName: 'Cursor', color: '#000000', domain: 'cursor.com', industry: 'tech' },
  { org: 'midjourney', displayName: 'Midjourney', color: '#000000', domain: 'midjourney.com', industry: 'tech' },
  { org: 'elevenlabs', displayName: 'ElevenLabs', color: '#1A1A2E', domain: 'elevenlabs.io', industry: 'tech' },
  { org: 'cartesia', displayName: 'Cartesia AI', color: '#5B21B6', domain: 'cartesia.ai', industry: 'tech' },
  { org: 'deepgram', displayName: 'Deepgram', color: '#3B1F82', domain: 'deepgram.com', industry: 'tech' },
  { org: 'pika', displayName: 'Pika', color: '#FF6B35', domain: 'pika.art', industry: 'tech' },

  // Fintech & Infrastructure (API-verified active)
  { org: 'plaid', displayName: 'Plaid', color: '#111827', domain: 'plaid.com', industry: 'tech' },
  { org: 'column', displayName: 'Column', color: '#1A56DB', domain: 'column.com', industry: 'tech' },

  // Dev Tools & Infrastructure
  { org: 'notion', displayName: 'Notion', color: '#000000', domain: 'notion.so', industry: 'tech' },
  { org: 'replit', displayName: 'Replit', color: '#F26207', domain: 'replit.com', industry: 'tech' },
  { org: 'ramp', displayName: 'Ramp', color: '#C4D82E', domain: 'ramp.com', industry: 'tech' },
  { org: 'linear', displayName: 'Linear', color: '#5E6AD2', domain: 'linear.app', industry: 'tech' },
  { org: 'supabase', displayName: 'Supabase', color: '#3ECF8E', domain: 'supabase.com', industry: 'tech' },
  { org: 'cohere', displayName: 'Cohere', color: '#39594C', domain: 'cohere.com', industry: 'tech' },

  // Additional public boards with strong remote, research, and new-grad coverage
  { org: 'baseten', displayName: 'Baseten', color: '#111111', domain: 'baseten.co', industry: 'tech' },
  { org: 'decagon', displayName: 'Decagon', color: '#111111', domain: 'decagon.ai', industry: 'tech' },
  { org: 'harvey', displayName: 'Harvey', color: '#111111', domain: 'harvey.ai', industry: 'tech' },
  { org: 'hightouch', displayName: 'Hightouch', color: '#6C47FF', domain: 'hightouch.com', industry: 'tech' },
  { org: 'langchain', displayName: 'LangChain', color: '#1C3C3C', domain: 'langchain.com', industry: 'tech' },
  { org: 'mercor', displayName: 'Mercor', color: '#111111', domain: 'mercor.com', industry: 'tech' },
  { org: 'modal', displayName: 'Modal', color: '#111111', domain: 'modal.com', industry: 'tech' },
  { org: 'motherduck', displayName: 'MotherDuck', color: '#F4B400', domain: 'motherduck.com', industry: 'tech' },
  { org: 'retool', displayName: 'Retool', color: '#3D4592', domain: 'retool.com', industry: 'tech' },
  { org: 'sierra', displayName: 'Sierra', color: '#111111', domain: 'sierra.ai', industry: 'tech' },
  { org: 'watershed', displayName: 'Watershed', color: '#1D4ED8', domain: 'watershed.com', industry: 'tech' },
];

const US_STATES_MAP: Record<string, string> = {
  california: 'CA', pennsylvania: 'PA', washington: 'WA', texas: 'TX',
  newyork: 'NY', 'new york': 'NY', massachusetts: 'MA', illinois: 'IL',
  florida: 'FL', colorado: 'CO', georgia: 'GA', northcarolina: 'NC',
  'north carolina': 'NC', virginia: 'VA', oregon: 'OR', newjersey: 'NJ',
  'new jersey': 'NJ', ohio: 'OH', michigan: 'MI', arizona: 'AZ',
};

export function extractStateFromLocation(loc?: string): string | undefined {
  if (!loc) return undefined;
  const match = loc.match(/(?:,\s*|US,\s*|\b)([A-Z]{2})(?:\s*[,•]|\s*$)/);
  if (match) return match[1].toUpperCase();

  const lower = loc.toLowerCase();
  for (const [name, code] of Object.entries(US_STATES_MAP)) {
    if (lower.includes(name)) return code;
  }
  return undefined;
}

function detectWorkplaceType(workplaceTypeStr?: string, isRemote?: boolean, locationStr?: string): WorkplaceType {
  if (isRemote || (workplaceTypeStr && workplaceTypeStr.toLowerCase().includes('remote'))) {
    return 'Remote';
  }
  if (workplaceTypeStr && workplaceTypeStr.toLowerCase().includes('hybrid')) {
    return 'Hybrid';
  }
  const loc = (locationStr || '').toLowerCase();
  if (loc.includes('remote') || loc.includes('virtual')) return 'Remote';
  if (loc.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function detectEmploymentType(empTypeStr?: string, titleStr?: string): EmploymentType {
  const combined = `${empTypeStr || ''} ${titleStr || ''}`.toLowerCase();
  if (
    combined.includes('part-time') ||
    combined.includes('parttime') ||
    combined.includes('part time') ||
    combined.includes('hourly')
  ) {
    return 'Part-time';
  }
  if (combined.includes('intern') || combined.includes('internship') || combined.includes('co-op')) {
    return 'Internship';
  }
  if (combined.includes('entry') || combined.includes('new grad') || combined.includes('university') || combined.includes('associate')) {
    return 'Entry Level';
  }
  if (combined.includes('contract') || combined.includes('contractor') || combined.includes('temporary')) {
    return 'Contract';
  }
  return 'Full-time';
}

export function adaptAshbyJob(raw: RawAshbyJob, config: AshbyOrgConfig): Job {
  const location = raw.location?.trim() || undefined;
  const state = raw.address?.postalAddress?.addressRegion?.toUpperCase() || extractStateFromLocation(location);
  const workplaceType = detectWorkplaceType(raw.workplaceType, raw.isRemote, location);
  const employmentType = detectEmploymentType(raw.employmentType, raw.title);
  const cleanDesc = cleanHtml(raw.descriptionPlain || raw.descriptionHtml);

  return {
    id: `ashby-${config.org}-${raw.id}`,
    provider: 'ashby',
    company: config.displayName,
    companyLogo: buildLogoUrl(config.domain),
    companyColor: config.color,
    industry: config.industry,
    title: raw.title.trim(),
    location,
    state,
    workplaceType,
    employmentType,
    department: raw.department || raw.team || undefined,
    description: raw.descriptionHtml || raw.descriptionPlain || '',
    cleanDescription: cleanDesc,
    salary: undefined,
    postedAt: raw.publishedAt || undefined,
    applyUrl: raw.applyUrl || raw.jobUrl,
    sourceUrl: raw.jobUrl,
  };
}
