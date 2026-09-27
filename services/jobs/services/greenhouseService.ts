import { GREENHOUSE_COMPANIES } from '../config/jobSources';
import {
  adaptGreenhouseJob,
  cleanHtml,
  extractSalaryFromContent,
  extractSectionsFromGreenhouseHtml,
  RawGreenhouseJob,
} from '../adapters/greenhouseAdapter';
import { Job } from '../types/Job';

const REQUEST_TIMEOUT_MS = 5000;

async function fetchCompanyJobs(token: string): Promise<Job[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Lightweight list fetch (omits multi-megabyte content=true HTML bodies)
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data?.jobs)) {
      return [];
    }

    // Keep a broad live catalog while avoiding unbounded payloads on mobile.
    const jobBatch = (data.jobs as RawGreenhouseJob[]).slice(0, 250);
    return jobBatch.map((raw) => adaptGreenhouseJob(raw, token));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch public jobs across all configured Greenhouse companies.
 * Uses Promise.allSettled so a failure on one company board never breaks the others.
 */
export async function fetchAllGreenhouseJobs(): Promise<Job[]> {
  const results = await Promise.allSettled(
    GREENHOUSE_COMPANIES.map((company) => fetchCompanyJobs(company.token)),
  );

  const jobs: Job[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
    }
  }

  return jobs;
}

/**
 * Fetch full content & rich description for a single job on demand (takes ~30ms).
 */
export async function fetchGreenhouseJobDetail(
  companyToken: string,
  rawJobId: string | number,
): Promise<{
  description?: string;
  cleanDescription?: string;
  salary?: string;
  responsibilities?: string[];
  requirements?: string[];
  aboutCompany?: string;
} | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(companyToken)}/jobs/${encodeURIComponent(rawJobId)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const rawContent: string | undefined = data?.content;
    if (!rawContent) return null;

    const cleanDesc = cleanHtml(rawContent);
    const salary = extractSalaryFromContent(rawContent);
    const sections = extractSectionsFromGreenhouseHtml(rawContent);

    return {
      description: rawContent,
      cleanDescription: cleanDesc,
      salary,
      responsibilities: sections.responsibilities,
      requirements: sections.requirements,
      aboutCompany: sections.aboutCompany,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
