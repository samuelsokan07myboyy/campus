import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LiveJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyColor: string;
  location: string;
  salary?: string;
  jobType: string;
  category: 'tech' | 'design' | 'business' | 'writing' | 'other';
  publicationDate: string;
  url: string;
  description: string;
  cleanDescription: string;
  tags: string[];
  isRemote: boolean;
  isOnCampus?: boolean;
}

const CACHED_JOBS_KEY = 'campus.live_api_jobs_v3';
const SAVED_JOBS_KEY = 'campus.saved_job_ids_v3';

export function cleanHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '\n### ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&bull;/gi, '•')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getCompanyColor(companyName: string): string {
  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#F97316',
  ];
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function categorizeJob(title: string, rawCat: string, tags: string[]): LiveJob['category'] {
  const text = `${title} ${rawCat} ${tags.join(' ')}`.toLowerCase();
  if (text.includes('software') || text.includes('developer') || text.includes('engineer') || text.includes('frontend') || text.includes('backend') || text.includes('tech') || text.includes('qa') || text.includes('ai') || text.includes('data')) {
    return 'tech';
  }
  if (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('product designer') || text.includes('creative') || text.includes('graphic')) {
    return 'design';
  }
  if (text.includes('sales') || text.includes('marketing') || text.includes('business') || text.includes('finance') || text.includes('account') || text.includes('operations')) {
    return 'business';
  }
  if (text.includes('writer') || text.includes('copy') || text.includes('content') || text.includes('editor')) {
    return 'writing';
  }
  return 'other';
}

export async function fetchRealJobsFromApi(): Promise<LiveJob[]> {
  const jobs: LiveJob[] = [];

  // 1. Fetch from Remotive API
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=40', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.jobs)) {
        for (const item of data.jobs) {
          const tags = Array.isArray(item.tags) ? item.tags.slice(0, 5) : [];
          const category = categorizeJob(item.title || '', item.category || '', tags);
          const salary = (item.salary || '').trim() || undefined;

          jobs.push({
            id: `remotive-${item.id}`,
            title: item.title || 'Untitled Role',
            company: item.company_name || 'Tech Company',
            companyLogo: item.company_logo || item.company_logo_url || undefined,
            companyColor: getCompanyColor(item.company_name || 'Tech'),
            location: item.candidate_required_location || 'Remote',
            salary,
            jobType: item.job_type ? item.job_type.replace('_', ' ') : 'Full-Time',
            category,
            publicationDate: item.publication_date || new Date().toISOString(),
            url: item.url || 'https://remotive.com',
            description: item.description || '',
            cleanDescription: cleanHtml(item.description || ''),
            tags,
            isRemote: true,
          });
        }
      }
    }
  } catch {
    // Continue to next source if Remotive is down
  }

  // 2. Fetch from Jobicy API
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=25', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.jobs)) {
        for (const item of data.jobs) {
          const tags = Array.isArray(item.jobTags) ? item.jobTags.slice(0, 5) : [];
          const category = categorizeJob(item.jobTitle || '', item.jobIndustry?.[0] || '', tags);
          const salary = item.salaryMin && item.salaryMax
            ? `$${Number(item.salaryMin).toLocaleString()} - $${Number(item.salaryMax).toLocaleString()} ${item.salaryCurrency || 'USD'}/${item.salaryPeriod || 'yr'}`
            : undefined;

          jobs.push({
            id: `jobicy-${item.id}`,
            title: item.jobTitle || 'Untitled Position',
            company: item.companyName || 'Company',
            companyLogo: item.companyLogo || undefined,
            companyColor: getCompanyColor(item.companyName || 'Job'),
            location: item.jobGeo || 'Remote (Global)',
            salary,
            jobType: Array.isArray(item.jobType) ? item.jobType.join(', ') : 'Remote',
            category,
            publicationDate: item.pubDate || new Date().toISOString(),
            url: item.url || 'https://jobicy.com',
            description: item.jobDescription || '',
            cleanDescription: cleanHtml(item.jobDescription || item.jobExcerpt || ''),
            tags,
            isRemote: true,
          });
        }
      }
    }
  } catch {
    // Continue
  }

  if (jobs.length > 0) {
    void AsyncStorage.setItem(CACHED_JOBS_KEY, JSON.stringify(jobs)).catch(() => undefined);
    return jobs;
  }

  // If both failed, load cached
  return getCachedLiveJobs();
}

export async function getCachedLiveJobs(): Promise<LiveJob[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getSavedJobIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function toggleSaveJobId(jobId: string): Promise<string[]> {
  try {
    const current = await getSavedJobIds();
    const updated = current.includes(jobId)
      ? current.filter((id) => id !== jobId)
      : [...current, jobId];
    await AsyncStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
