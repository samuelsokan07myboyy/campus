import { adaptWorkdayJob, RawWorkdayJob, WORKDAY_COMPANIES, WorkdayCompanyConfig } from '../adapters/workdayAdapter';
import { Job } from '../types/Job';

const REQUEST_TIMEOUT_MS = 5000;

async function fetchCompanyWorkdayJobs(config: WorkdayCompanyConfig): Promise<Job[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(config.cxsEndpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 100,
        offset: 0,
        searchText: '',
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data?.jobPostings)) return [];

    return (data.jobPostings as RawWorkdayJob[]).map((raw) => adaptWorkdayJob(raw, config));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAllWorkdayJobs(): Promise<Job[]> {
  const results = await Promise.allSettled(
    WORKDAY_COMPANIES.map((config) => fetchCompanyWorkdayJobs(config)),
  );

  const jobs: Job[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      jobs.push(...r.value);
    }
  }

  return jobs;
}
