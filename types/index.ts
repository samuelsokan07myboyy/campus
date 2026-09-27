export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  schoolId: string;
  schoolName: string;
  pronouns?: string;
  joinedAt?: Date;
  isVerified: boolean;
  major?: string;
  year?: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Grad';
  badges: Badge[];
  streakCount: number;
  bio?: string;
  link?: string;
  links?: string[];
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  studyHours?: number;
  lastStudySession?: Date;
};

export type Badge = {
  id: string;
  icon: string;
  name: string;
  color: string;
};

export type PostType = 'image' | 'video' | 'carousel';
export type PostCategory = 'Study' | 'Campus' | 'Drama' | 'Tips' | 'Meme' | 'Event';

export type Post = {
  id: string;
  author: User;
  type: PostType;
  mediaUrls: string[];
  mediaTypes?: ('image' | 'video')[];
  mediaDimensions?: { width: number; height: number }[];
  thumbnail?: string;
  caption: string;
  category: PostCategory;
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  likes: number;
  comments: number;
  saves: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: Date;
  tags?: string[];
};

export type VibeStatus = 'active' | 'ending_soon' | 'upcoming';

export type Vibe = {
  id: string;
  host: User;
  title: string;
  description: string;
  type: 'study' | 'party' | 'chill' | 'event' | 'food';
  location: {
    name: string;
    lat: number;
    lng: number;
    building?: string;
  };
  startTime: Date;
  endTime?: Date;
  attendeeCount: number;
  maxAttendees?: number;
  isPrivate: boolean;
  image?: string;
  status: VibeStatus;
  distance?: number;
};

export type StudySession = {
  id: string;
  host: User;
  participants: User[];
  subject: string;
  courseCode?: string;
  startTime: Date;
  duration: number;
  isLive: boolean;
  vibeId?: string;
  maxParticipants: number;
  mode: 'focus' | 'casual' | 'tutor';
};

export type Message = {
  id: string;
  sender: User;
  text: string;
  timestamp: Date;
  type: 'text' | 'image' | 'study_invite' | 'vibe_share';
  metadata?: any;
};

export type ToolType =
  | 'gpa_calculator'
  | 'ai_solver'
  | 'flashcards'
  | 'focus_timer'
  | 'doc_scanner'
  | 'syllabus_parser'
  | 'grade_predictor';

export type JobType = 'internship' | 'full_time' | 'part_time' | 'contract' | 'research';

export type Job = {
  id: string;
  company: string;
  companyLogo?: string;
  companyColor: string;
  role: string;
  type: JobType;
  location: string;
  isRemote: boolean;
  salary?: string;
  description: string;
  requirements: string[];
  majors: string[];
  postedAt: Date;
  deadline?: Date;
  applicants: number;
  alumniCount: number;
  isSaved: boolean;
  isApplied: boolean;
  tags: string[];
};

export type School = {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  location: string;
  type: 'ivy' | 'state' | 'private' | 'community';
};