import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job, JobFilterState } from './types/Job';
import { fetchAllGreenhouseJobs, fetchGreenhouseJobDetail } from './services/greenhouseService';
import { fetchAllLeverJobs } from './services/leverService';
import { fetchAllAshbyJobs } from './services/ashbyService';
import { fetchAllAmazonJobs } from './services/amazonService';
import { fetchAllWorkdayJobs } from './services/workdayService';
import { fetchBigTechDirectJobs } from './services/bigTechDirectService';

const CACHED_JOBS_STORAGE_KEY = 'campus.jobs.cache_v12';
const CACHE_TIMESTAMP_KEY = 'campus.jobs.cache_time_v12';
const CACHE_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours cache validity
const SAVED_JOB_IDS_KEY = 'campus.jobs.saved_ids_v1';
const SAVED_JOBS_DATA_KEY = 'campus.jobs.saved_data_v1';

let inMemoryJobsCache: Job[] | null = null;
let activeSelectedJob: Job | null = null;
let inFlightFetch: Promise<Job[]> | null = null;

export function setActiveSelectedJob(job: Job | null): void {
  activeSelectedJob = job;
}

export function getActiveSelectedJob(): Job | null {
  return activeSelectedJob;
}

/**
 * Synchronous in-memory lookup. Returns immediately (0ms latency).
 */
export function getCachedJobById(id?: string): Job | undefined {
  if (!id) return undefined;
  if (activeSelectedJob && activeSelectedJob.id === id) {
    return activeSelectedJob;
  }
  if (inMemoryJobsCache) {
    return inMemoryJobsCache.find((j) => j.id === id);
  }
  return undefined;
}

/**
 * Fast lookup by ID with fallback to AsyncStorage cache.
 */
export async function findJobById(id: string): Promise<Job | undefined> {
  const syncMatch = getCachedJobById(id);
  if (syncMatch) return syncMatch;

  try {
    const cachedRaw = await AsyncStorage.getItem(CACHED_JOBS_STORAGE_KEY);
    if (cachedRaw) {
      const parsed: Job[] = JSON.parse(cachedRaw);
      const match = parsed.find((j) => j.id === id);
      if (match) return match;
    }
  } catch {
    // Fall through
  }

  // Fallback to unified jobs
  const jobs = await fetchUnifiedJobs();
  return jobs.find((j) => j.id === id);
}

/**
 * On-demand job enrichment for single job details (Greenhouse).
 * Runs in ~30ms to fetch full rich descriptions and salary without bogging down the list feed.
 */
export async function enrichJobDetails(job: Job): Promise<Job> {
  if (job.cleanDescription && job.cleanDescription.length > 50) {
    return job;
  }

  if (job.provider === 'greenhouse') {
    const match = job.id.match(/^gh-([^-]+)-(.+)$/);
    if (match) {
      const [, companyToken, rawId] = match;
      try {
        const detail = await fetchGreenhouseJobDetail(companyToken, rawId);
        if (detail) {
          const enriched: Job = {
            ...job,
            description: detail.description || job.description,
            cleanDescription: detail.cleanDescription || job.cleanDescription,
            salary: detail.salary || job.salary,
            responsibilities: detail.responsibilities || job.responsibilities,
            requirements: detail.requirements || job.requirements,
            aboutCompany: detail.aboutCompany || job.aboutCompany,
          };
          setActiveSelectedJob(enriched);
          if (inMemoryJobsCache) {
            const idx = inMemoryJobsCache.findIndex((j) => j.id === job.id);
            if (idx !== -1) inMemoryJobsCache[idx] = enriched;
          }
          return enriched;
        }
      } catch {
        // Fallback to existing job
      }
    }
  }

  return job;
}

/**
 * Deduplicate jobs across providers and companies.
 * Compares company, normalized title, location, and applyUrl.
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  const seenKeys = new Set<string>();
  const uniqueJobs: Job[] = [];

  for (const job of jobs) {
    const key = `${job.company.toLowerCase()}|${job.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${(job.location || '').toLowerCase()}|${job.applyUrl}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueJobs.push(job);
    }
  }

  return uniqueJobs;
}

/**
 * Fetch unified jobs from all providers (Greenhouse, Lever, Ashby, Amazon, Workday).
 * Provider-isolated using Promise.allSettled so a failure on one never crashes the others.
 */
export async function fetchUnifiedJobs(forceRefresh = false): Promise<Job[]> {
  if (!forceRefresh && inMemoryJobsCache && inMemoryJobsCache.length > 0) {
    return inMemoryJobsCache;
  }

  // Load from local AsyncStorage cache first for instant display
  if (!forceRefresh) {
    try {
      const [cachedRaw, cacheTimeRaw] = await Promise.all([
        AsyncStorage.getItem(CACHED_JOBS_STORAGE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
      ]);

      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryJobsCache = parsed;

          // Check if cache is still fresh (< 4 hours)
          const cacheTime = cacheTimeRaw ? parseInt(cacheTimeRaw, 10) : 0;
          const isFresh = Date.now() - cacheTime < CACHE_MAX_AGE_MS;

          // If fresh, return immediately with ZERO background network requests!
          if (isFresh) {
            return parsed;
          }

          // If stale, refresh in background only once
          if (!inFlightFetch) {
            void backgroundRefresh();
          }
          return parsed;
        }
      }
    } catch {
      // Ignore and fetch fresh
    }
  }

  return await fetchFreshJobs();
}

async function backgroundRefresh(): Promise<void> {
  try {
    await fetchFreshJobs();
  } catch {
    // Ignore background refresh errors
  }
}

async function fetchFreshJobs(): Promise<Job[]> {
  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = (async () => {
    try {
      const [ghResult, leverResult, ashbyResult, amazonResult, workdayResult, directResult] = await Promise.allSettled([
        fetchAllGreenhouseJobs(),
        fetchAllLeverJobs(),
        fetchAllAshbyJobs(),
        fetchAllAmazonJobs(),
        fetchAllWorkdayJobs(),
        fetchBigTechDirectJobs(),
      ]);

      const allFetched: Job[] = [];

      if (ghResult.status === 'fulfilled') allFetched.push(...ghResult.value);
      if (leverResult.status === 'fulfilled') allFetched.push(...leverResult.value);
      if (ashbyResult.status === 'fulfilled') allFetched.push(...ashbyResult.value);
      if (amazonResult.status === 'fulfilled') allFetched.push(...amazonResult.value);
      if (workdayResult.status === 'fulfilled') allFetched.push(...workdayResult.value);
      if (directResult.status === 'fulfilled') allFetched.push(...directResult.value);

      const unique = deduplicateJobs(allFetched);

      // Sort: Internships and entry level or recent first
      unique.sort((a, b) => {
        const aIsStudent = a.employmentType === 'Internship' || a.employmentType === 'Entry Level';
        const bIsStudent = b.employmentType === 'Internship' || b.employmentType === 'Entry Level';
        if (aIsStudent && !bIsStudent) return -1;
        if (!aIsStudent && bIsStudent) return 1;

        const aTime = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const bTime = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return bTime - aTime;
      });

      inMemoryJobsCache = unique;

      // Cache to AsyncStorage with timestamp
      try {
        await Promise.all([
          AsyncStorage.setItem(CACHED_JOBS_STORAGE_KEY, JSON.stringify(unique)),
          AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString()),
        ]);
      } catch {
        // Local storage non-critical error
      }

      return unique;
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

/**
 * Smart location matcher supporting Philly, PA, NYC, SF Bay Area aliases and state codes.
 */
export function matchesLocation(jobLoc?: string, query?: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const loc = (jobLoc || '').toLowerCase();

  // Philadelphia-only aliases for the local spotlight and quick filter.
  if (q === 'philly' || q === 'philadelphia') {
    return (
      loc.includes('philadelphia') ||
      loc.includes('philly') ||
      loc.includes('king of prussia') ||
      loc.includes('conshohocken')
    );
  }

  // Pennsylvania statewide aliases.
  if (q === 'pa' || q === 'pennsylvania') {
    return (
      loc.includes(' pa') ||
      loc.includes(', pa') ||
      loc.includes('pennsylvania') ||
      loc.includes('king of prussia') ||
      loc.includes('conshohocken') ||
      loc.includes('pittsburgh') ||
      loc.includes('harrisburg') ||
      loc.includes('allentown') ||
      loc.includes('bethlehem') ||
      loc.includes('scranton') ||
      loc.includes('lancaster') ||
      loc.includes('reading') ||
      loc.includes('erie') ||
      loc.includes('state college')
    );
  }

  // Smart NYC aliases
  if (q === 'nyc' || q === 'ny' || q === 'new york') {
    return (
      loc.includes('new york') ||
      loc.includes('nyc') ||
      loc.includes(' ny') ||
      loc.includes(', ny') ||
      loc.includes('brooklyn') ||
      loc.includes('manhattan')
    );
  }

  // Smart SF / Bay Area / California aliases
  if (q === 'sf' || q === 'bay area' || q === 'san francisco' || q === 'ca' || q === 'california') {
    return (
      loc.includes('san francisco') ||
      loc.includes('sf') ||
      loc.includes('bay area') ||
      loc.includes(' ca') ||
      loc.includes(', ca') ||
      loc.includes('california') ||
      loc.includes('palo alto') ||
      loc.includes('mountain view') ||
      loc.includes('sunnyvale') ||
      loc.includes('san jose')
    );
  }

  return loc.includes(q);
}

/**
 * Filter jobs based on search query, state, workplace, industry, and filter pills.
 */
export function filterJobs(jobs: Job[], filters: JobFilterState): Job[] {
  const searchQ = filters.searchQuery ? filters.searchQuery.toLowerCase().trim() : '';
  const locQ = filters.locationQuery ? filters.locationQuery.toLowerCase().trim() : '';
  const stateQ = filters.stateQuery ? filters.stateQuery.toUpperCase().trim() : '';
  const compQ = filters.companyQuery ? filters.companyQuery.toLowerCase().trim() : '';
  const fourteenDaysAgo = filters.recentlyPostedOnly ? Date.now() - 14 * 86400000 : 0;

  return jobs.filter((job) => {
    // 1. Fast enum & state filters first (instant rejection)
    if (filters.workplaceType && filters.workplaceType !== 'all') {
      if (job.workplaceType !== filters.workplaceType) return false;
    }

    if (filters.employmentType && filters.employmentType !== 'all') {
      if (job.employmentType !== filters.employmentType) return false;
    }

    if (filters.industry && filters.industry !== 'all') {
      if (job.industry !== filters.industry) return false;
    }

    if (stateQ && stateQ !== 'ALL') {
      if (
        job.workplaceType !== 'Remote' &&
        job.state !== stateQ &&
        !matchesLocation(job.location, stateQ)
      ) {
        return false;
      }
    }

    if (fourteenDaysAgo > 0 && job.postedAt) {
      if (new Date(job.postedAt).getTime() < fourteenDaysAgo) return false;
    }

    if (compQ && !job.company.toLowerCase().includes(compQ)) {
      return false;
    }

    if (locQ && !matchesLocation(job.location, locQ)) {
      return false;
    }

    // 2. Search query check (Matches title, company, location, employmentType, workplace, aliases)
    if (searchQ) {
      // Keyword shortcuts for student job types
      if (
        (searchQ === 'intern' || searchQ === 'internship' || searchQ === 'coop' || searchQ === 'co-op') &&
        job.employmentType === 'Internship'
      ) {
        return true;
      }
      if (
        (searchQ === 'part-time' || searchQ === 'part time' || searchQ === 'parttime' || searchQ === 'hourly') &&
        job.employmentType === 'Part-time'
      ) {
        return true;
      }
      if (
        (searchQ === 'entry' || searchQ === 'entry level' || searchQ === 'entry-level' || searchQ === 'new grad') &&
        job.employmentType === 'Entry Level'
      ) {
        return true;
      }
      if (searchQ === 'remote' && job.workplaceType === 'Remote') {
        return true;
      }

      // Location alias matching in main search bar
      if (
        (searchQ === 'philly' || searchQ === 'pa' || searchQ === 'philadelphia' || searchQ === 'pennsylvania') &&
        matchesLocation(
          job.location,
          searchQ === 'philly' || searchQ === 'philadelphia' ? 'philly' : 'pa',
        )
      ) {
        return true;
      }
      if (
        (searchQ === 'nyc' || searchQ === 'ny' || searchQ === 'new york') &&
        matchesLocation(job.location, 'ny')
      ) {
        return true;
      }
      if (
        (searchQ === 'sf' || searchQ === 'bay area' || searchQ === 'california' || searchQ === 'ca') &&
        matchesLocation(job.location, 'ca')
      ) {
        return true;
      }

      // 2-letter state code matching (e.g. PA, NJ, NY, CA, TX, WA)
      if (searchQ.length === 2 && job.state && job.state.toLowerCase() === searchQ) {
        return true;
      }

      // Smart Big Tech search shortcuts & typo handling (ChatGPT, Google, Meta, NVIDIA, X, Perplexity)
      if (
        (searchQ === 'chatgpt' || searchQ === 'chat-gpt' || searchQ === 'gpt' || searchQ === 'sam altman') &&
        (job.company.toLowerCase().includes('openai') || job.title.toLowerCase().includes('chatgpt'))
      ) {
        return true;
      }
      if (
        (searchQ === 'goole' || searchQ === 'goog' || searchQ === 'alphabet' || searchQ === 'deepmind') &&
        job.company.toLowerCase().includes('google')
      ) {
        return true;
      }
      if (
        (searchQ === 'nvida' || searchQ === 'geforce' || searchQ === 'jensen') &&
        job.company.toLowerCase().includes('nvidia')
      ) {
        return true;
      }
      if (
        (searchQ === 'x' || searchQ === 'twitter' || searchQ === 'xcorp' || searchQ === 'grok' || searchQ === 'elon')
      ) {
        return (
          job.company.toLowerCase() === 'x' ||
          job.company.toLowerCase().includes('twitter') ||
          job.company.toLowerCase().includes('x corp')
        );
      }
      if (
        (searchQ === 'facebook' || searchQ === 'fb' || searchQ === 'instagram' || searchQ === 'zuck' || searchQ === 'llama') &&
        (job.company.toLowerCase().includes('meta') || job.company.toLowerCase().includes('facebook'))
      ) {
        return true;
      }
      if (
        (searchQ === 'perplexity' || searchQ === 'pplx') &&
        job.company.toLowerCase().includes('perplexity')
      ) {
        return true;
      }

      // Single-letter search check: exact company match only (e.g. 'X')
      if (searchQ.length === 1) {
        return job.company.toLowerCase() === searchQ;
      }

      // General substring checks across all relevant job fields
      if (
        job.title.toLowerCase().includes(searchQ) ||
        job.company.toLowerCase().includes(searchQ) ||
        (job.department && job.department.toLowerCase().includes(searchQ)) ||
        (job.location && job.location.toLowerCase().includes(searchQ)) ||
        (job.employmentType && job.employmentType.toLowerCase().includes(searchQ)) ||
        (job.workplaceType && job.workplaceType.toLowerCase().includes(searchQ)) ||
        (job.industry && job.industry.toLowerCase().includes(searchQ)) ||
        (job.salary && job.salary.toLowerCase().includes(searchQ)) ||
        (job.cleanDescription && job.cleanDescription.slice(0, 400).toLowerCase().includes(searchQ))
      ) {
        return true;
      }
      return false;
    }

    return true;
  });
}

const CAMPUS_STATE_MAP: Record<string, { state: string; nearbyStates: string[]; cities: string[] }> = {
  temple: { state: 'PA', nearbyStates: ['PA', 'NJ', 'NY', 'DE', 'MD'], cities: ['philadelphia', 'king of prussia', 'conshohocken', 'cherry hill'] },
  ucla: { state: 'CA', nearbyStates: ['CA', 'NV', 'AZ', 'OR', 'WA'], cities: ['los angeles', 'santa monica', 'culver city', 'irvine', 'san diego'] },
  usc: { state: 'CA', nearbyStates: ['CA', 'NV', 'AZ', 'OR', 'WA'], cities: ['los angeles', 'santa monica', 'culver city', 'irvine', 'san diego'] },
  berkeley: { state: 'CA', nearbyStates: ['CA', 'NV', 'OR', 'WA'], cities: ['san francisco', 'berkeley', 'oakland', 'palo alto', 'mountain view', 'sunnyvale', 'san jose'] },
  stanford: { state: 'CA', nearbyStates: ['CA', 'NV', 'OR', 'WA'], cities: ['san francisco', 'palo alto', 'mountain view', 'sunnyvale', 'san jose'] },
  harvard: { state: 'MA', nearbyStates: ['MA', 'RI', 'NH', 'CT', 'NY'], cities: ['boston', 'cambridge'] },
  mit: { state: 'MA', nearbyStates: ['MA', 'RI', 'NH', 'CT', 'NY'], cities: ['boston', 'cambridge'] },
  columbia: { state: 'NY', nearbyStates: ['NY', 'NJ', 'CT', 'PA'], cities: ['new york', 'brooklyn', 'manhattan', 'queens'] },
  nyu: { state: 'NY', nearbyStates: ['NY', 'NJ', 'CT', 'PA'], cities: ['new york', 'brooklyn', 'manhattan', 'queens'] },
  penn: { state: 'PA', nearbyStates: ['PA', 'NJ', 'NY', 'DE', 'MD'], cities: ['philadelphia', 'king of prussia'] },
};

/**
 * Section Partitioning without repeating jobs between sections.
 */
export function partitionJobSections(
  jobs: Job[],
  userMajor?: string,
  userSchoolId?: string,
  userSchoolName?: string,
): {
  recommended: Job[];
  phillyAndPa: Job[];
  nearCampus: Job[];
  bigTechAndAI: Job[];
  partTimeAndHourly: Job[];
  retailFoodWarehouse: Job[];
  internships: Job[];
  entryLevel: Job[];
  remote: Job[];
  recentlyPosted: Job[];
  allRemaining: Job[];
} {
  const seenIds = new Set<string>();

  // 1. Recommended for you (Matches user major or student preferences)
  const normMajor = (userMajor || 'computer science').toLowerCase();
  const recommended: Job[] = [];
  for (const job of jobs) {
    if (recommended.length >= 6) break;
    if (job.employmentType === 'Internship' || job.employmentType === 'Entry Level') {
      const titleAndDept = `${job.title} ${job.department || ''}`.toLowerCase();
      if (
        titleAndDept.includes(normMajor) ||
        titleAndDept.includes('software') ||
        titleAndDept.includes('engineer') ||
        titleAndDept.includes('developer') ||
        titleAndDept.includes('design') ||
        titleAndDept.includes('product')
      ) {
        seenIds.add(job.id);
        recommended.push(job);
      }
    }
  }

  // 2. Philadelphia & PA Spotlight. Rank local roles toward student-friendly work.
  const localEmploymentPriority: Record<string, number> = {
    'Part-time': 0,
    'Entry Level': 1,
    'Full-time': 2,
    Contract: 3,
  };
  const localIndustryPriority: Record<string, number> = {
    fastfood: 0,
    retail: 1,
    warehouse: 2,
    petcare: 3,
    tech: 4,
  };
  const paJobs = jobs
    .filter(
      (job) =>
        !seenIds.has(job.id) &&
        job.employmentType !== 'Internship' &&
        matchesLocation(job.location, 'philly'),
    )
    .sort((first, second) => {
      const employmentDifference =
        (localEmploymentPriority[first.employmentType || ''] ?? 9) -
        (localEmploymentPriority[second.employmentType || ''] ?? 9);
      if (employmentDifference !== 0) return employmentDifference;

      const industryDifference =
        (localIndustryPriority[first.industry || ''] ?? 9) -
        (localIndustryPriority[second.industry || ''] ?? 9);
      if (industryDifference !== 0) return industryDifference;

      const firstPosted = first.postedAt ? new Date(first.postedAt).getTime() : 0;
      const secondPosted = second.postedAt ? new Date(second.postedAt).getTime() : 0;
      return secondPosted - firstPosted;
    });
  const phillyAndPa: Job[] = [];
  for (const job of paJobs.slice(0, 8)) {
    seenIds.add(job.id);
    phillyAndPa.push(job);
  }

  // 3. Near Your Campus & State (Local & Regional Opportunities)
  const campusKey = (userSchoolId || '').toLowerCase();
  const campusProfile = CAMPUS_STATE_MAP[campusKey] || {
    state: (userSchoolName || '').toLowerCase().includes('temple') ? 'PA' : 'CA',
    nearbyStates: ['PA', 'NJ', 'NY', 'DE', 'MD', 'CA'],
    cities: ['philadelphia', 'los angeles', 'san francisco'],
  };

  const nearCampus: Job[] = [];
  for (const job of jobs) {
    if (nearCampus.length >= 8) break;
    if (!seenIds.has(job.id)) {
      const jobLoc = (job.location || '').toLowerCase();
      const isLocalCity = campusProfile.cities.some((c) => jobLoc.includes(c));
      const isLocalState = job.state ? campusProfile.nearbyStates.includes(job.state) : false;

      if (isLocalCity || isLocalState) {
        seenIds.add(job.id);
        nearCampus.push(job);
      }
    }
  }

  // 3. Big Tech & Leading AI Labs (Google, Meta, X, Amazon, Nvidia, OpenAI, Perplexity, Cursor, Stripe, Figma)
  const bigTechAndAI: Job[] = [];
  const BIG_TECH_NAMES = [
    'google',
    'meta',
    'x',
    'amazon',
    'nvidia',
    'openai',
    'perplexity',
    'cursor',
    'stripe',
    'notion',
    'anthropic',
    'figma',
    'spotify',
    'palantir',
    'cloudflare',
    'databricks',
    'roblox',
    'coinbase',
    'datadog',
    'discord',
    'reddit',
  ];
  for (const job of jobs) {
    if (bigTechAndAI.length >= 8) break;
    if (!seenIds.has(job.id)) {
      const compLower = job.company.toLowerCase();
      if (BIG_TECH_NAMES.some((n) => compLower.includes(n))) {
        seenIds.add(job.id);
        bigTechAndAI.push(job);
      }
    }
  }

  // 4. Part-Time & Student Hourly Jobs (Baristas, retail associates, crew, campus roles)
  const partTimeAndHourly: Job[] = [];
  for (const job of jobs) {
    if (partTimeAndHourly.length >= 8) break;
    if (!seenIds.has(job.id) && job.employmentType === 'Part-time') {
      seenIds.add(job.id);
      partTimeAndHourly.push(job);
    }
  }

  // 5. Retail, Food & Warehouse (Sweetgreen, Target, Gopuff, Glossier, Everlane, HelloFresh, Flexport)
  const retailFoodWarehouse: Job[] = [];
  for (const job of jobs) {
    if (retailFoodWarehouse.length >= 8) break;
    if (
      !seenIds.has(job.id) &&
      (job.industry === 'fastfood' || job.industry === 'retail' || job.industry === 'warehouse' || job.industry === 'petcare')
    ) {
      seenIds.add(job.id);
      retailFoodWarehouse.push(job);
    }
  }

  // 6. Internships, prioritizing Philly CS, AI, and cybersecurity roles.
  const internshipKeywords = /computer science|software|data science|machine learning|artificial intelligence|ai|cyber|security|information technology|developer|engineering/i;
  const internships: Job[] = jobs
    .filter((job) => !seenIds.has(job.id) && job.employmentType === 'Internship')
    .sort((first, second) => {
      const firstIsPhilly = matchesLocation(first.location, 'philly');
      const secondIsPhilly = matchesLocation(second.location, 'philly');
      if (firstIsPhilly !== secondIsPhilly) return firstIsPhilly ? -1 : 1;

      const firstText = `${first.title} ${first.department || ''} ${first.cleanDescription}`;
      const secondText = `${second.title} ${second.department || ''} ${second.cleanDescription}`;
      const firstIsTechnical = internshipKeywords.test(firstText);
      const secondIsTechnical = internshipKeywords.test(secondText);
      if (firstIsTechnical !== secondIsTechnical) return firstIsTechnical ? -1 : 1;

      const firstPosted = first.postedAt ? new Date(first.postedAt).getTime() : 0;
      const secondPosted = second.postedAt ? new Date(second.postedAt).getTime() : 0;
      return secondPosted - firstPosted;
    })
    .slice(0, 8);
  for (const job of internships) {
    seenIds.add(job.id);
  }

  // 7. Entry-level jobs
  const entryLevel: Job[] = [];
  for (const job of jobs) {
    if (entryLevel.length >= 8) break;
    if (!seenIds.has(job.id) && job.employmentType === 'Entry Level') {
      seenIds.add(job.id);
      entryLevel.push(job);
    }
  }

  // 8. Remote opportunities
  const remote: Job[] = [];
  for (const job of jobs) {
    if (remote.length >= 8) break;
    if (!seenIds.has(job.id) && job.workplaceType === 'Remote') {
      seenIds.add(job.id);
      remote.push(job);
    }
  }

  // 9. Recently posted (within last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const recentlyPosted: Job[] = [];
  for (const job of jobs) {
    if (recentlyPosted.length >= 8) break;
    if (!seenIds.has(job.id) && job.postedAt && new Date(job.postedAt).getTime() >= sevenDaysAgo) {
      seenIds.add(job.id);
      recentlyPosted.push(job);
    }
  }

  // 10. All remaining jobs
  const allRemaining: Job[] = jobs.filter((job) => !seenIds.has(job.id));

  return {
    recommended,
    phillyAndPa,
    nearCampus,
    bigTechAndAI,
    partTimeAndHourly,
    retailFoodWarehouse,
    internships,
    entryLevel,
    remote,
    recentlyPosted,
    allRemaining,
  };
}

/**
 * Saved Jobs Persistence (AsyncStorage)
 */
export async function getSavedJobIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_JOB_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getSavedJobs(): Promise<Job[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_JOBS_DATA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function toggleSaveJob(job: Job): Promise<{ isSaved: boolean; allSavedIds: string[] }> {
  try {
    const currentIds = await getSavedJobIds();
    const currentJobs = await getSavedJobs();

    const isAlreadySaved = currentIds.includes(job.id);

    let nextIds: string[];
    let nextJobs: Job[];

    if (isAlreadySaved) {
      nextIds = currentIds.filter((id) => id !== job.id);
      nextJobs = currentJobs.filter((j) => j.id !== job.id);
    } else {
      nextIds = [job.id, ...currentIds];
      nextJobs = [job, ...currentJobs.filter((j) => j.id !== job.id)];
    }

    await AsyncStorage.setItem(SAVED_JOB_IDS_KEY, JSON.stringify(nextIds));
    await AsyncStorage.setItem(SAVED_JOBS_DATA_KEY, JSON.stringify(nextJobs));

    return {
      isSaved: !isAlreadySaved,
      allSavedIds: nextIds,
    };
  } catch {
    return {
      isSaved: false,
      allSavedIds: [],
    };
  }
}

export function formatTimeAgo(dateString?: string): string | undefined {
  if (!dateString) return undefined;
  const time = new Date(dateString).getTime();
  if (isNaN(time)) return undefined;

  const seconds = Math.floor((Date.now() - time) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Posted 1 day ago';
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'Posted 1 month ago';
  return `Posted ${months} months ago`;
}
