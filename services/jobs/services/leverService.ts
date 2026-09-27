import { LEVER_COMPANIES } from '../config/jobSources';
import { adaptLeverJob, RawLeverPosting } from '../adapters/leverAdapter';
import { Job } from '../types/Job';

const REQUEST_TIMEOUT_MS = 6000;

async function fetchCompanyJobs(token: string): Promise<Job[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    // Keep a broad live catalog while avoiding unbounded payloads on mobile.
    const jobBatch = (data as RawLeverPosting[]).slice(0, 250);
    return jobBatch.map((raw) => adaptLeverJob(raw, token));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch public jobs across all configured Lever companies.
 * Uses Promise.allSettled so a failure on one company board never breaks the others.
 */
export async function fetchAllLeverJobs(): Promise<Job[]> {
  const results = await Promise.allSettled(
    LEVER_COMPANIES.map((company) => fetchCompanyJobs(company.token)),
  );

  const jobs: Job[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
    }
  }

  return jobs;
}
