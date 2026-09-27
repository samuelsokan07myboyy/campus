import { adaptAmazonJob, RawAmazonJob } from '../adapters/amazonAdapter';
import { Job } from '../types/Job';

const REQUEST_TIMEOUT_MS = 5000;

export async function fetchAllAmazonJobs(): Promise<Job[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = 'https://www.amazon.jobs/en/search.json?country=USA&result_limit=25';
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (CampusApp)',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data?.jobs)) return [];

    return (data.jobs as RawAmazonJob[]).map(adaptAmazonJob);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
