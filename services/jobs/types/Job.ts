export type JobProvider = 'greenhouse' | 'lever' | 'ashby' | 'amazon' | 'workday' | 'direct';
export type WorkplaceType = 'Remote' | 'Hybrid' | 'On-site';
export type EmploymentType = 'Internship' | 'Full-time' | 'Part-time' | 'Contract' | 'Entry Level';

export type JobIndustry = 'fastfood' | 'retail' | 'warehouse' | 'tech' | 'petcare';

export interface Job {
  id: string; // Unique stable identifier: e.g. `gh-{token}-{id}` or `ashby-{org}-{id}`
  provider: JobProvider;
  company: string;
  companyLogo?: string;
  companyColor: string;
  industry?: JobIndustry;
  title: string;
  location?: string;
  state?: string; // 2-letter US state code e.g. 'PA', 'CA', 'WA', 'NY' if applicable
  workplaceType?: WorkplaceType;
  employmentType?: EmploymentType;
  department?: string;
  description?: string; // Original content
  cleanDescription: string; // Sanitized readable markdown/text
  responsibilities?: string[];
  requirements?: string[];
  aboutCompany?: string;
  salary?: string; // ONLY if provided by API, do NOT invent
  postedAt?: string; // ISO date string if provided
  applyUrl: string; // Real original application URL
  sourceUrl: string; // Public job board listing URL
}

export interface JobFilterState {
  searchQuery: string;
  workplaceType?: WorkplaceType | 'all';
  employmentType?: EmploymentType | 'all';
  industry?: JobIndustry | 'all';
  locationQuery?: string;
  stateQuery?: string;
  companyQuery?: string;
  recentlyPostedOnly?: boolean;
}
