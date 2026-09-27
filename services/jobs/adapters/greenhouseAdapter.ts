import { Job, EmploymentType, WorkplaceType } from '../types/Job';
import { getCompanyMeta } from '../config/jobSources';

export interface RawGreenhouseJob {
  id: number | string;
  title: string;
  company_name?: string;
  absolute_url: string;
  location?: {
    name?: string;
  };
  updated_at?: string;
  first_published?: string;
  content?: string;
  departments?: Array<{ id: number; name: string }>;
  offices?: Array<{ id: number; name: string }>;
  metadata?: Array<{ name: string; value: string }>;
}

export function decodeHtmlEntities(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');
}

export function fullyDecodeHtml(raw?: string): string {
  if (!raw) return '';
  let prev = raw;
  for (let i = 0; i < 2; i++) {
    const next = decodeHtmlEntities(prev);
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

export function cleanHtml(rawHtml?: string): string {
  if (!rawHtml) return '';
  const decoded = fullyDecodeHtml(rawHtml);

  return decoded
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n### ')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectWorkplaceType(locationStr?: string, titleStr?: string, contentStr?: string): WorkplaceType {
  const combined = `${locationStr || ''} ${titleStr || ''} ${contentStr || ''}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('virtual') || combined.includes('anywhere')) {
    return 'Remote';
  }
  if (combined.includes('hybrid') || combined.includes('flexible')) {
    return 'Hybrid';
  }
  return 'On-site';
}

function detectEmploymentType(titleStr?: string, contentStr?: string): EmploymentType {
  const combined = `${titleStr || ''} ${contentStr || ''}`.toLowerCase();
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
  if (combined.includes('new grad') || combined.includes('entry level') || combined.includes('university grad') || combined.includes('associate')) {
    return 'Entry Level';
  }
  if (combined.includes('contract') || combined.includes('temporary') || combined.includes('contractor')) {
    return 'Contract';
  }
  return 'Full-time';
}

export function extractSalaryFromContent(content?: string): string | undefined {
  if (!content) return undefined;
  const decoded = fullyDecodeHtml(content);
  // Look for patterns like "$120,000 - $160,000" or "$45 - $65/hr" or "$50,000—$70,000"
  const salaryRegex = /(?:\$|USD\s*)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|–|—|to)\s*(?:\$|USD\s*)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/|\s+per\s+)?(year|yr|hour|hr|month|mo)?/i;
  const match = decoded.match(salaryRegex);
  if (match) {
    const min = match[1];
    const max = match[2];
    const period = match[3] ? `/${match[3].toLowerCase()}` : '';
    return `$${min} - $${max}${period}`;
  }
  return undefined;
}

export interface ExtractedSections {
  responsibilities?: string[];
  requirements?: string[];
  aboutRole?: string;
  aboutCompany?: string;
}

export function extractSectionsFromGreenhouseHtml(rawHtml?: string): ExtractedSections {
  if (!rawHtml) return {};
  const decoded = fullyDecodeHtml(rawHtml);

  const responsibilities: string[] = [];
  const requirements: string[] = [];
  let aboutCompany: string | undefined;

  // Split decoded HTML by headings or strong section titles
  // Look for <ul> lists and examine preceding heading text
  const sectionRegex = /(?:<h[1-6][^>]*>(.*?)<\/h[1-6]>|<strong[^>]*>(.*?)<\/strong>|<b[^>]*>(.*?)<\/b>)([\s\S]*?)(?=(?:<h[1-6]|<strong|<b|$))/gi;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(decoded)) !== null) {
    const heading = cleanHtml(match[1] || match[2] || match[3] || '').toLowerCase();
    const sectionBody = match[4] || '';

    // Extract list items from this section
    const listItems = [...sectionBody.matchAll(/<li[^>]*>(.*?)<\/li>/gis)]
      .map((m) => cleanHtml(m[1]).replace(/^[•\-\*]\s*/, '').trim())
      .filter((s) => s.length > 5 && s.length < 400);

    if (listItems.length > 0) {
      if (
        heading.includes('responsibilit') ||
        heading.includes('what you') ||
        heading.includes('role') ||
        heading.includes('what to expect') ||
        heading.includes('will do') ||
        heading.includes('duties')
      ) {
        responsibilities.push(...listItems);
      } else if (
        heading.includes('require') ||
        heading.includes('qualificat') ||
        heading.includes('looking for') ||
        heading.includes('bring') ||
        heading.includes('skills') ||
        heading.includes('who you are') ||
        heading.includes('background')
      ) {
        requirements.push(...listItems);
      }
    }

    if (heading.includes('about') && !heading.includes('role') && !heading.includes('position')) {
      const cleanedBody = cleanHtml(sectionBody);
      if (cleanedBody.length > 30) {
        aboutCompany = cleanedBody;
      }
    }
  }

  // Fallback: if no structured sections were captured via headings, extract all <li> items
  if (responsibilities.length === 0 && requirements.length === 0) {
    const allListItems = [...decoded.matchAll(/<li[^>]*>(.*?)<\/li>/gis)]
      .map((m) => cleanHtml(m[1]).replace(/^[•\-\*]\s*/, '').trim())
      .filter((s) => s.length > 5 && s.length < 400);

    if (allListItems.length > 0) {
      // Split in half or take first batch as responsibilities
      if (allListItems.length >= 6) {
        const mid = Math.ceil(allListItems.length / 2);
        responsibilities.push(...allListItems.slice(0, mid));
        requirements.push(...allListItems.slice(mid, allListItems.length));
      } else {
        responsibilities.push(...allListItems);
      }
    }
  }

  return {
    responsibilities: responsibilities.length > 0 ? responsibilities.slice(0, 10) : undefined,
    requirements: requirements.length > 0 ? requirements.slice(0, 10) : undefined,
    aboutCompany,
  };
}

export function adaptGreenhouseJob(raw: RawGreenhouseJob, companyToken: string): Job {
  const meta = getCompanyMeta(companyToken, raw.company_name);
  const location = raw.location?.name?.trim() || undefined;
  const workplaceType = detectWorkplaceType(location, raw.title, raw.content);
  const employmentType = detectEmploymentType(raw.title, raw.content);
  const department = raw.departments?.[0]?.name?.trim() || undefined;
  const cleanDesc = cleanHtml(raw.content);
  const salary = extractSalaryFromContent(raw.content);
  const postedAt = raw.first_published || raw.updated_at || undefined;
  const sections = extractSectionsFromGreenhouseHtml(raw.content);

  return {
    id: `gh-${companyToken}-${raw.id}`,
    provider: 'greenhouse',
    company: meta.displayName,
    companyLogo: meta.logoUrl,
    companyColor: meta.color,
    industry: meta.industry,
    title: raw.title.trim(),
    location,
    workplaceType,
    employmentType,
    department,
    description: raw.content || '',
    cleanDescription: cleanDesc,
    responsibilities: sections.responsibilities,
    requirements: sections.requirements,
    aboutCompany: sections.aboutCompany,
    salary,
    postedAt,
    applyUrl: raw.absolute_url,
    sourceUrl: raw.absolute_url,
  };
}
