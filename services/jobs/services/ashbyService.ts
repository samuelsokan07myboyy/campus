import { adaptAshbyJob, ASHBY_ORGS, AshbyOrgConfig, RawAshbyJob } from '../adapters/ashbyAdapter';
import { Job } from '../types/Job';

const REQUEST_TIMEOUT_MS = 5000;

async function fetchOrgJobs(config: AshbyOrgConfig): Promise<Job[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(config.org)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data?.jobs)) return [];

    const batch = (data.jobs as RawAshbyJob[]).slice(0, 250);
    return batch.map((raw) => adaptAshbyJob(raw, config));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAllAshbyJobs(): Promise<Job[]> {
  const results = await Promise.allSettled(
    ASHBY_ORGS.map((config) => fetchOrgJobs(config)),
  );

  const jobs: Job[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      jobs.push(...r.value);
    }
  }

  return jobs;
}
