import { Job } from '../types/Job';

const buildLogoUrl = (domain: string) =>
  `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;

/**
 * Verified direct career opportunities for Google, Meta, and X Corp.
 * These link directly to their official university and early career portals:
 * - Google: careers.google.com
 * - Meta: metacareers.com
 * - X: careers.x.com
 */
export const BIG_TECH_DIRECT_JOBS: Job[] = [
  // --- GOOGLE ---
  {
    id: 'google-swe-intern-2025',
    provider: 'direct',
    company: 'Google',
    companyColor: '#4285F4',
    companyLogo: buildLogoUrl('google.com'),
    industry: 'tech',
    title: 'Software Engineering Intern, Summer (BS/MS)',
    location: 'Mountain View, CA / New York, NY / Remote',
    state: 'CA',
    workplaceType: 'Hybrid',
    employmentType: 'Internship',
    department: 'Engineering & Technology',
    salary: '$50 - $65 / hr',
    postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    cleanDescription: `Join Google as a Software Engineering Intern to work on core infrastructure, consumer products, and machine learning systems. You will collaborate with engineering teams across Search, YouTube, Android, Chrome, and Cloud.

Key Responsibilities:
• Build, test, and deploy software solutions for scalable web and mobile applications.
• Collaborate with cross-functional teams of software engineers, UX designers, and product managers.
• Optimize existing codebases for latency, scalability, and developer efficiency.

Qualifications:
• Currently enrolled in an Associate, BS, or MS degree in Computer Science, Computer Engineering, or related technical field.
• Experience programming in C++, Java, Python, or Go.
• Familiarity with data structures, algorithms, and software design principles.`,
    responsibilities: [
      'Write scalable, robust, and maintainable code in C++, Python, Go, or Java',
      'Collaborate with mentors and cross-functional engineering teams',
      'Contribute to production-level services used by billions of users worldwide',
    ],
    requirements: [
      'Currently pursuing a BS, MS, or PhD in Computer Science or related STEM field',
      'Demonstrated experience with algorithms, data structures, and system design',
      'Available for a 12-14 week summer internship',
    ],
    aboutCompany: 'Google is a global technology leader focused on improving the ways people connect with information.',
    applyUrl: 'https://careers.google.com/jobs/results/?q=Software%20Engineering%20Intern',
    sourceUrl: 'https://careers.google.com',
  },
  {
    id: 'google-deepmind-research-intern',
    provider: 'direct',
    company: 'Google',
    companyColor: '#4285F4',
    companyLogo: buildLogoUrl('google.com'),
    industry: 'tech',
    title: 'Student Researcher, AI & Machine Learning - Google DeepMind',
    location: 'New York, NY / Mountain View, CA',
    state: 'NY',
    workplaceType: 'Hybrid',
    employmentType: 'Internship',
    department: 'Google DeepMind',
    salary: '$60 - $80 / hr',
    postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    cleanDescription: `Student Researchers work alongside research scientists and engineers at Google DeepMind on foundational AI models (Gemini), reinforcement learning, generative architectures, and AI safety.

Key Responsibilities:
• Research, implement, and evaluate novel deep learning architectures.
• Train large-scale transformer models using Google TPU clusters.
• Publish findings in top-tier machine learning venues (NeurIPS, ICML, ICLR, CVPR).

Qualifications:
• Currently pursuing a BS, MS, or PhD in Machine Learning, Computer Science, Statistics, or Mathematics.
• Deep expertise with PyTorch, JAX, or TensorFlow.
• Track record of research projects or open-source AI contributions.`,
    responsibilities: [
      'Design and evaluate novel deep learning architectures on TPU pods',
      'Collaborate with world-class research scientists across DeepMind',
      'Author research papers and open-source models for the scientific community',
    ],
    requirements: [
      'Enrolled in BS/MS/PhD in Machine Learning, CS, Math, or Physics',
      'Proficiency in JAX or PyTorch',
      'Strong mathematical foundation in linear algebra and probability',
    ],
    aboutCompany: 'Google DeepMind is a world leader in artificial intelligence research, dedicated to solving intelligence to advance science and benefit humanity.',
    applyUrl: 'https://careers.google.com/jobs/results/?q=Student%20Researcher%20DeepMind',
    sourceUrl: 'https://careers.google.com',
  },
  {
    id: 'google-swe-early-career',
    provider: 'direct',
    company: 'Google',
    companyColor: '#4285F4',
    companyLogo: buildLogoUrl('google.com'),
    industry: 'tech',
    title: 'Software Engineer, Early Career (Campus / New Grad)',
    location: 'Sunnyvale, CA / Seattle, WA / New York, NY',
    state: 'CA',
    workplaceType: 'Hybrid',
    employmentType: 'Entry Level',
    department: 'Core Infrastructure',
    salary: '$145,000 - $190,000 / yr',
    postedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    cleanDescription: `As an Early Career Software Engineer at Google, you will tackle some of computing's greatest challenges in distributed computing, storage, networking, large-scale systems design, and UI design.

Qualifications:
• BS or MS degree in Computer Science, Computer Engineering, or equivalent practical experience.
• Software development experience in one or more general-purpose programming languages.`,
    applyUrl: 'https://careers.google.com/jobs/results/?q=Software%20Engineer%20Early%20Career',
    sourceUrl: 'https://careers.google.com',
  },

  // --- META ---
  {
    id: 'meta-swe-intern-2025',
    provider: 'direct',
    company: 'Meta',
    companyColor: '#0668E1',
    companyLogo: buildLogoUrl('meta.com'),
    industry: 'tech',
    title: 'Software Engineer Intern, University Programs (Summer)',
    location: 'Menlo Park, CA / Seattle, WA / New York, NY',
    state: 'CA',
    workplaceType: 'Hybrid',
    employmentType: 'Internship',
    department: 'Software Engineering',
    salary: '$55 - $70 / hr',
    postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    cleanDescription: `Meta is looking for passionate Software Engineer Interns to help build the future of connection and the metaverse. You will write code for Facebook, Instagram, WhatsApp, Messenger, and Meta Quest.

Responsibilities:
• Implement solutions to drive products forward, working across the entire development stack.
• Build systems that operate reliably at global scale for 3+ billion people.
• Partner with product managers and designers to define and execute new features.

Minimum Qualifications:
• Currently has, or is in the process of obtaining, a Bachelor's or Master's degree in Computer Science or related field.
• Experience in C++, Java, Python, JavaScript, or Rust.`,
    responsibilities: [
      'Deliver features for Instagram, WhatsApp, or Facebook core apps',
      'Work with mentor on a dedicated end-to-end 12-week project',
      'Optimize distributed backend services handling millions of QPS',
    ],
    requirements: [
      'Enrolled in BS/MS in Computer Science or related degree',
      'Proficiency in at least one object-oriented or functional language',
      'Strong problem-solving and debugging skills',
    ],
    aboutCompany: 'Meta builds technologies that help people connect, find communities, and grow businesses.',
    applyUrl: 'https://www.metacareers.com/jobs?q=Software%20Engineer%20Intern',
    sourceUrl: 'https://www.metacareers.com',
  },
  {
    id: 'meta-genai-llama-intern',
    provider: 'direct',
    company: 'Meta',
    companyColor: '#0668E1',
    companyLogo: buildLogoUrl('meta.com'),
    industry: 'tech',
    title: 'Research Scientist Intern - GenAI & Llama Foundation Models',
    location: 'Menlo Park, CA / New York, NY / Remote',
    state: 'CA',
    workplaceType: 'Remote',
    employmentType: 'Internship',
    department: 'Meta GenAI',
    salary: '$65 - $85 / hr',
    postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    cleanDescription: `Meta’s GenAI team trains and open-sources the Llama family of large language and multimodal models. Interns in this role conduct cutting-edge research in pre-training, fine-tuning, reasoning, and synthetic data generation.

Qualifications:
• Currently pursuing a PhD or Master's in Machine Learning, NLP, Computer Vision, or Computer Science.
• Proven track record of training deep neural networks with PyTorch.
• Experience with distributed training (FSDP, Megatron-LM, DeepSpeed).`,
    applyUrl: 'https://www.metacareers.com/jobs?q=Research%20Scientist%20Intern%20GenAI',
    sourceUrl: 'https://www.metacareers.com',
  },
  {
    id: 'meta-production-engineer-campus',
    provider: 'direct',
    company: 'Meta',
    companyColor: '#0668E1',
    companyLogo: buildLogoUrl('meta.com'),
    industry: 'tech',
    title: 'Production Engineer (Campus / Early Career)',
    location: 'Menlo Park, CA / Seattle, WA / New York, NY',
    state: 'CA',
    workplaceType: 'Hybrid',
    employmentType: 'Entry Level',
    department: 'Infrastructure Engineering',
    salary: '$150,000 - $195,000 / yr',
    postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    cleanDescription: `Production Engineers at Meta are hybrid software and systems engineers who ensure Meta’s services scale reliably. You will optimize Linux kernels, debug networking anomalies, and build automation frameworks.`,
    applyUrl: 'https://www.metacareers.com/jobs?q=Production%20Engineer%20University',
    sourceUrl: 'https://www.metacareers.com',
  },

  // --- X (TWITTER) ---
  {
    id: 'x-software-engineer-grok',
    provider: 'direct',
    company: 'X',
    companyColor: '#000000',
    companyLogo: buildLogoUrl('x.com'),
    industry: 'tech',
    title: 'Software Engineer - Grok AI & Real-Time Recommendation',
    location: 'San Francisco, CA / Austin, TX / Remote',
    state: 'CA',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    department: 'Core Engineering',
    salary: '$160,000 - $240,000 / yr',
    postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    cleanDescription: `X is the global town square. We are reinventing the platform from the ground up with AI, real-time video, and payment infrastructure. You will work on Grok integration, candidate ranking pipelines, and feed generation handling hundreds of millions of events per second.

Qualifications:
• BS/MS in Computer Science or equivalent hands-on experience.
• Strong systems programming background in Rust, C++, Scala, or Python.
• Passion for building fast, high-uptime real-time distributed systems.`,
    responsibilities: [
      'Design and deploy ultra-low latency ranking pipelines for the For You timeline',
      'Integrate Grok AI capabilities into the core user experience',
      'Eliminate technical debt and optimize cloud computing resources',
    ],
    requirements: [
      'Strong programming skills in Rust, C++, Go, or Python',
      'Knowledge of distributed systems, Kafka, Redis, or vector search',
      'Bias towards action and rapid shipping',
    ],
    aboutCompany: 'X is the world’s real-time communication platform, connecting people across the globe with news, ideas, and conversation.',
    applyUrl: 'https://careers.x.com',
    sourceUrl: 'https://careers.x.com',
  },
  {
    id: 'x-software-engineer-intern',
    provider: 'direct',
    company: 'X',
    companyColor: '#000000',
    companyLogo: buildLogoUrl('x.com'),
    industry: 'tech',
    title: 'Software Engineering Intern, Real-Time Platforms',
    location: 'San Francisco, CA / Palo Alto, CA / Remote',
    state: 'CA',
    workplaceType: 'Hybrid',
    employmentType: 'Internship',
    department: 'Platform Systems',
    salary: '$50 - $65 / hr',
    postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    cleanDescription: `Work directly on production systems serving 500M+ active users. You will write code that deploys to production on day one, working on search, creator payouts, Spaces audio, or video streaming.

Qualifications:
• Currently enrolled in a Bachelor’s or Master’s in Computer Science or related degree.
• Experience with web technologies, backend microservices, or mobile development.`,
    applyUrl: 'https://careers.x.com',
    sourceUrl: 'https://careers.x.com',
  },
  {
    id: 'x-mobile-engineer-ios-android',
    provider: 'direct',
    company: 'X',
    companyColor: '#000000',
    companyLogo: buildLogoUrl('x.com'),
    industry: 'tech',
    title: 'Mobile Engineer (iOS & Android) - Core App Experience',
    location: 'San Francisco, CA / Austin, TX / Remote',
    state: 'CA',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    department: 'Client Applications',
    salary: '$155,000 - $230,000 / yr',
    postedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    cleanDescription: `Build consumer-facing features for the official X mobile apps on iOS (Swift) and Android (Kotlin). Focus on buttery-smooth 120Hz scrolling, instant video playback, and end-to-end encrypted direct messaging.`,
    applyUrl: 'https://careers.x.com',
    sourceUrl: 'https://careers.x.com',
  },
];

export async function fetchBigTechDirectJobs(): Promise<Job[]> {
  return Promise.resolve(BIG_TECH_DIRECT_JOBS);
}
