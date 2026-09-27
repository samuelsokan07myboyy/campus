import { Job, EmploymentType, WorkplaceType } from '../types/Job';
import { getCompanyMeta } from '../config/jobSources';
import { cleanHtml } from './greenhouseAdapter';

export interface RawLeverPosting {
  id: string;
  text: string;
  createdAt?: number;
  description?: string;
  descriptionPlain?: string;
  descriptionBody?: string;
  additional?: string;
  additionalPlain?: string;
  lists?: Array<{ text: string; content: string }>;
  categories?: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
    workplaceType?: string;
  };
  workplaceType?: string;
  hostedUrl: string;
  applyUrl: string;
}

function detectWorkplaceType(workplaceTypeStr?: string, locationStr?: string, titleStr?: string): WorkplaceType {
  const combined = `${workplaceTypeStr || ''} ${locationStr || ''} ${titleStr || ''}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('virtual')) {
    return 'Remote';
  }
  if (combined.includes('hybrid') || combined.includes('flexible')) {
    return 'Hybrid';
  }
  return 'On-site';
}

function detectEmploymentType(commitmentStr?: string, titleStr?: string): EmploymentType {
  const combined = `${commitmentStr || ''} ${titleStr || ''}`.toLowerCase();
  // Part-time and hourly roles prioritized first
  if (
    combined.includes('part-time') ||
    combined.includes('part time') ||
    combined.includes('hourly') ||
    combined.includes('seasonal') ||
    combined.includes('pt ') ||
    combined.includes('(pt)') ||
    combined.includes('barista') ||
    combined.includes('crew member') ||
    combined.includes('team member') ||
    combined.includes('cashier') ||
    combined.includes('warehouse associate') ||
    combined.includes('forklift') ||
    combined.includes('retail ambassador') ||
    combined.includes('ambassador') ||
    combined.includes('sales associate')
  ) {
    return 'Part-time';
  }
  if (combined.includes('intern') || combined.includes('internship') || combined.includes('co-op')) {
    return 'Internship';
  }
  if (combined.includes('entry') || combined.includes('new grad') || combined.includes('university') || combined.includes('associate')) {
    return 'Entry Level';
  }
  if (combined.includes('contract') || combined.includes('temporary') || combined.includes('contractor')) {
    return 'Contract';
  }
  return 'Full-time';
}

export function adaptLeverJob(raw: RawLeverPosting, companyToken: string): Job {
  const meta = getCompanyMeta(companyToken);
  const location = raw.categories?.location?.trim() || undefined;
  const workplaceType = detectWorkplaceType(raw.workplaceType || raw.categories?.workplaceType, location, raw.text);
  const employmentType = detectEmploymentType(raw.categories?.commitment, raw.text);
  const department = raw.categories?.department?.trim() || raw.categories?.team?.trim() || undefined;

  let fullRawDescription = raw.description || raw.descriptionBody || raw.descriptionPlain || '';
  let responsibilities: string[] | undefined;
  let requirements: string[] | undefined;

  if (Array.isArray(raw.lists)) {
    for (const list of raw.lists) {
      const heading = (list.text || '').toLowerCase();
      const items = cleanHtml(list.content)
        .split('\n')
        .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
        .filter((s) => s.length > 5);

      if (items.length > 0) {
        if (heading.includes('responsibilit') || heading.includes('what you') || heading.includes('do') || heading.includes('role')) {
          responsibilities = items.slice(0, 8);
        } else if (heading.includes('require') || heading.includes('qualificat') || heading.includes('bring') || heading.includes('looking for')) {
          requirements = items.slice(0, 8);
        }
      }
      fullRawDescription += `\n\n### ${list.text}\n${list.content}`;
    }
  }

  if (raw.additional) {
    fullRawDescription += `\n\n${raw.additional}`;
  }

  const cleanDesc = cleanHtml(fullRawDescription);
  const postedAt = raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined;

  return {
    id: `lever-${companyToken}-${raw.id}`,
    provider: 'lever',
    company: meta.displayName,
    companyLogo: meta.logoUrl,
    companyColor: meta.color,
    industry: meta.industry,
    title: raw.text.trim(),
    location,
    workplaceType,
    employmentType,
    department,
    description: fullRawDescription,
    cleanDescription: cleanDesc,
    responsibilities,
    requirements,
    aboutCompany: raw.additionalPlain?.trim() || undefined,
    salary: undefined, // Lever public API typically does not provide salary unless in custom fields
    postedAt,
    applyUrl: raw.applyUrl || raw.hostedUrl,
    sourceUrl: raw.hostedUrl,
  };
}
