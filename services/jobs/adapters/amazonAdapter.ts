import { Job, EmploymentType, WorkplaceType } from '../types/Job';
import { cleanHtml } from './greenhouseAdapter';

export interface RawAmazonJob {
  id: string;
  id_icims?: string;
  title: string;
  location?: string;
  normalized_location?: string;
  state?: string;
  job_schedule_type?: string;
  job_category?: string;
  description_short?: string;
  preferred_qualifications?: string;
  posted_date?: string;
  url_next_step?: string;
  job_path?: string;
}

const buildLogoUrl = (domain: string) =>
  `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;

function detectWorkplaceType(locationStr?: string, titleStr?: string): WorkplaceType {
  const combined = `${locationStr || ''} ${titleStr || ''}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('virtual')) return 'Remote';
  if (combined.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function detectEmploymentType(scheduleStr?: string, titleStr?: string): EmploymentType {
  const combined = `${scheduleStr || ''} ${titleStr || ''}`.toLowerCase();
  if (combined.includes('part-time') || combined.includes('part time') || combined.includes('hourly') || combined.includes('seasonal')) {
    return 'Part-time';
  }
  if (combined.includes('intern') || combined.includes('internship') || combined.includes('co-op')) {
    return 'Internship';
  }
  if (combined.includes('entry') || combined.includes('new grad') || combined.includes('associate') || combined.includes('graduate')) {
    return 'Entry Level';
  }
  return 'Full-time';
}

export function adaptAmazonJob(raw: RawAmazonJob): Job {
  const location = raw.normalized_location || raw.location || 'United States';
  const state = raw.state?.toUpperCase() || (location.includes(', ') ? location.split(', ')[1]?.slice(0, 2).toUpperCase() : undefined);
  const workplaceType = detectWorkplaceType(location, raw.title);
  const employmentType = detectEmploymentType(raw.job_schedule_type, raw.title);
  const cleanDesc = cleanHtml(raw.description_short || '');
  const applyUrl = raw.url_next_step || (raw.job_path ? `https://www.amazon.jobs${raw.job_path}` : 'https://www.amazon.jobs');
  const sourceUrl = raw.job_path ? `https://www.amazon.jobs${raw.job_path}` : 'https://www.amazon.jobs';

  return {
    id: `amazon-${raw.id_icims || raw.id}`,
    provider: 'amazon',
    company: 'Amazon',
    companyLogo: buildLogoUrl('amazon.com'),
    companyColor: '#FF9900',
    industry: 'tech',
    title: raw.title.trim(),
    location,
    state,
    workplaceType,
    employmentType,
    department: raw.job_category || 'Amazon Operations & Tech',
    description: raw.description_short || '',
    cleanDescription: cleanDesc,
    salary: undefined,
    postedAt: raw.posted_date ? new Date(raw.posted_date).toISOString() : undefined,
    applyUrl,
    sourceUrl,
  };
}
