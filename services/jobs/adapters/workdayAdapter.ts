import { Job, EmploymentType, WorkplaceType, JobIndustry } from '../types/Job';
import { extractStateFromLocation } from './ashbyAdapter';

export interface RawWorkdayJob {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
}

export interface WorkdayCompanyConfig {
  id: string;
  displayName: string;
  color: string;
  domain: string;
  industry: JobIndustry;
  baseUrl: string;
  cxsEndpoint: string;
  siteId: string;
}

const buildLogoUrl = (domain: string) =>
  `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;

export const WORKDAY_COMPANIES: WorkdayCompanyConfig[] = [
  {
    id: 'nvidia',
    displayName: 'NVIDIA',
    color: '#76B900',
    domain: 'nvidia.com',
    industry: 'tech',
    baseUrl: 'https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite',
    cxsEndpoint: 'https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs',
    siteId: 'NVIDIAExternalCareerSite',
  },
  {
    id: 'target',
    displayName: 'Target',
    color: '#CC0000',
    domain: 'target.com',
    industry: 'retail',
    baseUrl: 'https://target.wd5.myworkdayjobs.com/en-US/targetcareers',
    cxsEndpoint: 'https://target.wd5.myworkdayjobs.com/wday/cxs/target/targetcareers/jobs',
    siteId: 'targetcareers',
  },
  {
    id: 'comcast',
    displayName: 'Comcast',
    color: '#0B5CAB',
    domain: 'comcast.com',
    industry: 'tech',
    baseUrl: 'https://comcast.wd1.myworkdayjobs.com/en-US/Comcast_Careers',
    cxsEndpoint: 'https://comcast.wd1.myworkdayjobs.com/wday/cxs/comcast/Comcast_Careers/jobs',
    siteId: 'Comcast_Careers',
  },
  {
    id: 'pennmedicine',
    displayName: 'Penn Medicine',
    color: '#00558C',
    domain: 'pennmedicine.org',
    industry: 'tech',
    baseUrl: 'https://pennmedicine.wd1.myworkdayjobs.com/en-US/External',
    cxsEndpoint: 'https://pennmedicine.wd1.myworkdayjobs.com/wday/cxs/pennmedicine/External/jobs',
    siteId: 'External',
  },
  {
    id: 'jefferson-health',
    displayName: 'Jefferson Health',
    color: '#0066A1',
    domain: 'jeffersonhealth.org',
    industry: 'tech',
    baseUrl: 'https://jeffersonhealth.wd1.myworkdayjobs.com/en-US/Jefferson_External_Careers',
    cxsEndpoint: 'https://jeffersonhealth.wd1.myworkdayjobs.com/wday/cxs/jeffersonhealth/Jefferson_External_Careers/jobs',
    siteId: 'Jefferson_External_Careers',
  },
  {
    id: 'temple-health',
    displayName: 'Temple Health',
    color: '#A6192E',
    domain: 'tuhs.temple.edu',
    industry: 'tech',
    baseUrl: 'https://templehealth.wd1.myworkdayjobs.com/en-US/Temple_Health',
    cxsEndpoint: 'https://templehealth.wd1.myworkdayjobs.com/wday/cxs/templehealth/Temple_Health/jobs',
    siteId: 'Temple_Health',
  },
  {
    id: 'cencora',
    displayName: 'Cencora',
    color: '#007A53',
    domain: 'cencora.com',
    industry: 'tech',
    baseUrl: 'https://cencora.wd1.myworkdayjobs.com/en-US/CencoraCareers',
    cxsEndpoint: 'https://cencora.wd1.myworkdayjobs.com/wday/cxs/cencora/CencoraCareers/jobs',
    siteId: 'CencoraCareers',
  },
  {
    id: 'aramark',
    displayName: 'Aramark',
    color: '#0072CE',
    domain: 'aramark.com',
    industry: 'fastfood',
    baseUrl: 'https://aramark.wd5.myworkdayjobs.com/en-US/External',
    cxsEndpoint: 'https://aramark.wd5.myworkdayjobs.com/wday/cxs/aramark/External/jobs',
    siteId: 'External',
  },
  {
    id: 'qvc',
    displayName: 'QVC',
    color: '#111111',
    domain: 'qvc.com',
    industry: 'retail',
    baseUrl: 'https://qvc.wd5.myworkdayjobs.com/en-US/QVCJobs',
    cxsEndpoint: 'https://qvc.wd5.myworkdayjobs.com/wday/cxs/qvc/QVCJobs/jobs',
    siteId: 'QVCJobs',
  },
  {
    id: 'five-below',
    displayName: 'Five Below',
    color: '#00AEEF',
    domain: 'fivebelow.com',
    industry: 'retail',
    baseUrl: 'https://fivebelow.wd1.myworkdayjobs.com/en-US/FiveBelowCareers',
    cxsEndpoint: 'https://fivebelow.wd1.myworkdayjobs.com/wday/cxs/fivebelow/FiveBelowCareers/jobs',
    siteId: 'FiveBelowCareers',
  },
  {
    id: 'fmc',
    displayName: 'FMC Corporation',
    color: '#007A53',
    domain: 'fmc.com',
    industry: 'tech',
    baseUrl: 'https://fmc.wd1.myworkdayjobs.com/en-US/FMC_Careers',
    cxsEndpoint: 'https://fmc.wd1.myworkdayjobs.com/wday/cxs/fmc/FMC_Careers/jobs',
    siteId: 'FMC_Careers',
  },
];

function detectWorkplaceType(locationsText?: string, titleStr?: string): WorkplaceType {
  const combined = `${locationsText || ''} ${titleStr || ''}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('virtual')) return 'Remote';
  if (combined.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function detectEmploymentType(titleStr?: string): EmploymentType {
  const lower = (titleStr || '').toLowerCase();
  if (
    lower.includes('part-time') ||
    lower.includes('part time') ||
    lower.includes('hourly') ||
    lower.includes('seasonal') ||
    lower.includes('stocking') ||
    lower.includes('inbound') ||
    lower.includes('guest advocate') ||
    lower.includes('cashier') ||
    lower.includes('associate')
  ) {
    return 'Part-time';
  }
  if (lower.includes('intern') || lower.includes('internship') || lower.includes('co-op')) {
    return 'Internship';
  }
  if (lower.includes('entry') || lower.includes('new grad') || lower.includes('university')) {
    return 'Entry Level';
  }
  return 'Full-time';
}

export function adaptWorkdayJob(raw: RawWorkdayJob, config: WorkdayCompanyConfig): Job {
  const location = raw.locationsText || 'Multiple Locations';
  const state = extractStateFromLocation(location);
  const workplaceType = detectWorkplaceType(location, raw.title);
  const employmentType = detectEmploymentType(raw.title);
  const jobId = raw.bulletFields?.[0] || raw.externalPath.replace(/[^a-zA-Z0-9]/g, '_');
  const fullUrl = `${config.baseUrl}${raw.externalPath}`;

  return {
    id: `workday-${config.id}-${jobId}`,
    provider: 'workday',
    company: config.displayName,
    companyLogo: buildLogoUrl(config.domain),
    companyColor: config.color,
    industry: config.industry,
    title: raw.title.trim(),
    location,
    state,
    workplaceType,
    employmentType,
    department: config.id === 'target' ? 'Store & Fulfillment Operations' : 'Engineering & Technology',
    description: `Official opportunity at ${config.displayName}. View full details and apply directly through the employer portal.`,
    cleanDescription: `Role at ${config.displayName} in ${location}. Apply on the official careers page for complete requirements.`,
    salary: undefined,
    postedAt: undefined,
    applyUrl: fullUrl,
    sourceUrl: fullUrl,
  };
}
