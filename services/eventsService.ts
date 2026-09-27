import AsyncStorage from '@react-native-async-storage/async-storage';

export const EVENT_CATEGORIES = [
  { id: 'All', label: 'All', emoji: '✨' },
  { id: 'Parties', label: 'Parties', emoji: '🎉' },
  { id: 'Fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'Music', label: 'Music', emoji: '🎵' },
  { id: 'Food', label: 'Food', emoji: '🍜' },
  { id: 'Sports', label: 'Sports', emoji: '🏀' },
  { id: 'Workshops', label: 'Workshops', emoji: '🎓' },
  { id: 'Hangouts', label: 'Hangouts', emoji: '☕' },
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number]['id'];
export type EventRsvpStatus = 'going' | 'interested';
export type EventRsvpSelection = EventRsvpStatus | 'none';

export type EventPerson = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  isVerified?: boolean;
};

export type CampusEvent = {
  id: string;
  title: string;
  description: string;
  category: Exclude<EventCategory, 'All'>;
  coverUrl?: string;
  startTime: string;
  endTime?: string;
  locationName: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  isFree: boolean;
  price?: string;
  ticketUrl?: string;
  maxCapacity?: number;
  ageLimit: string;
  dressCode?: string;
  goingCount: number;
  interestedCount: number;
  createdAt: string;
  host: EventPerson;
  attendees: EventPerson[];
  userRsvp: EventRsvpStatus | null;
};

export type CreateEventData = Pick<
  CampusEvent,
  | 'title'
  | 'description'
  | 'category'
  | 'startTime'
  | 'endTime'
  | 'locationName'
  | 'locationAddress'
  | 'isFree'
  | 'price'
  | 'ticketUrl'
  | 'maxCapacity'
  | 'ageLimit'
  | 'dressCode'
>;

type StoredEvent = Omit<CampusEvent, 'userRsvp'> & {
  rsvps: Record<string, EventRsvpStatus>;
};

const STORAGE_KEY = '@campus_events_local_v1';
const DISCUSSION_KEY = '@campus_event_discussions_v1';
const DEFAULT_USER_ID = 'user-samuel-01';

const samplePeople: EventPerson[] = [
  {
    id: 'user-maya-01',
    username: 'maya.codes',
    name: 'Maya Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces',
    isVerified: true,
  },
  {
    id: 'user-niko-01',
    username: 'niko.m',
    name: 'Niko Martinez',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces',
  },
  {
    id: 'user-ari-01',
    username: 'ari.h',
    name: 'Ari Holt',
    avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=128&h=128&fit=crop&crop=faces',
    isVerified: true,
  },
  {
    id: 'user-jules-01',
    username: 'jules.r',
    name: 'Jules Rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=128&h=128&fit=crop&crop=faces',
  },
];

const hourFromNow = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const makeSeedEvents = (): StoredEvent[] => {
  const events: Array<Omit<StoredEvent, 'rsvps'>> = [
    {
      id: 'local-event-1',
      title: 'Rooftop cinema, no plans required',
      description: 'A feel-good movie, warm lights, and a little late-night popcorn. Bring a blanket if you have one.',
      category: 'Hangouts',
      coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1400&auto=format&fit=crop&q=85',
      startTime: hourFromNow(1, 19),
      endTime: hourFromNow(1, 22),
      locationName: 'Student Center Rooftop',
      locationAddress: '1801 N Broad Street',
      isFree: true,
      ageLimit: 'All Ages',
      dressCode: 'Come as you are',
      goingCount: 42,
      interestedCount: 18,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      host: samplePeople[0],
      attendees: samplePeople.slice(0, 4),
    },
    {
      id: 'local-event-2',
      title: 'First Friday: campus after dark',
      description: 'DJs from the student radio crew, a dance floor, and the best people on campus in one room.',
      category: 'Parties',
      coverUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&auto=format&fit=crop&q=85',
      startTime: hourFromNow(2, 21),
      endTime: hourFromNow(3, 1),
      locationName: 'The Foundry',
      locationAddress: '1000 Frankford Avenue',
      isFree: false,
      price: '$8',
      maxCapacity: 180,
      ageLimit: '18+',
      dressCode: 'Express yourself',
      goingCount: 86,
      interestedCount: 31,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
      host: samplePeople[1],
      attendees: [samplePeople[1], samplePeople[2], samplePeople[3]],
    },
    {
      id: 'local-event-3',
      title: 'Sunset miles & coffee after',
      description: 'An easy, no-drop 5K around campus. Every pace is welcome, and coffee is on us at the finish.',
      category: 'Fitness',
      coverUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1400&auto=format&fit=crop&q=85',
      startTime: hourFromNow(3, 17),
      endTime: hourFromNow(3, 19),
      locationName: 'Kresge Oval',
      locationAddress: 'North side entrance',
      isFree: true,
      ageLimit: 'All Ages',
      goingCount: 23,
      interestedCount: 12,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      host: samplePeople[2],
      attendees: samplePeople.slice(1),
    },
    {
      id: 'local-event-4',
      title: 'Clay, coffee & a tiny vase',
      description: 'A relaxed beginner pottery workshop. Materials, coffee, and a take-home piece are included.',
      category: 'Workshops',
      coverUrl: 'https://images.unsplash.com/photo-1565193298595-6d0d2a1d5f73?w=1400&auto=format&fit=crop&q=85',
      startTime: hourFromNow(5, 15),
      endTime: hourFromNow(5, 17),
      locationName: 'Tyler School of Art, Studio 204',
      locationAddress: '2001 N 13th Street',
      isFree: false,
      price: '$12',
      maxCapacity: 24,
      ageLimit: 'All Ages',
      dressCode: 'Clothes you can get messy',
      goingCount: 19,
      interestedCount: 27,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      host: samplePeople[3],
      attendees: [samplePeople[0], samplePeople[2]],
    },
    {
      id: 'local-event-5',
      title: 'Open mic, first timers welcome',
      description: 'Poetry, acoustic sets, comedy, or just good listening. Sign-up starts at 7:30.',
      category: 'Music',
      coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1400&auto=format&fit=crop&q=85',
      startTime: hourFromNow(6, 20),
      endTime: hourFromNow(6, 23),
      locationName: 'The Underground',
      locationAddress: 'Student Center, lower level',
      isFree: true,
      ageLimit: 'All Ages',
      goingCount: 36,
      interestedCount: 22,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      host: samplePeople[0],
      attendees: samplePeople.slice(0, 3),
    },
    {
      id: 'local-event-6',
      title: 'Dumpling crawl on Cecil B.',
      description: 'Four stops, plenty to share, and a vote for the best dumpling in the neighborhood.',
      category: 'Food',
      coverUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1400&auto=format&fit=crop&q=85',
      startTime: hourFromNow(7, 18),
      endTime: hourFromNow(7, 21),
      locationName: 'Meet at Liacouras Walk',
      locationAddress: 'North entrance by the clock',
      isFree: true,
      ageLimit: 'All Ages',
      goingCount: 17,
      interestedCount: 9,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 31).toISOString(),
      host: samplePeople[1],
      attendees: samplePeople.slice(0, 2),
    },
    {
      id: 'local-event-7',
      title: '3-on-3 under the lights',
      description: 'Quick games, mixed teams, and a friendly campus bracket. Drop in solo or bring your crew.',
      category: 'Sports',
      coverUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1400&auto=format&fit=crop&q=85',
      startTime: hourFromNow(8, 18),
      endTime: hourFromNow(8, 20),
      locationName: 'Geasey Field House',
      locationAddress: '1301 W Norris Street',
      isFree: true,
      maxCapacity: 48,
      ageLimit: 'All Ages',
      goingCount: 28,
      interestedCount: 16,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
      host: samplePeople[2],
      attendees: samplePeople.slice(1),
    },
  ];

  return events.map((event): StoredEvent => ({
    ...event,
    rsvps: event.id === 'local-event-1' ? { [DEFAULT_USER_ID]: 'interested' } : {},
  }));
};

async function readStoredEvents(): Promise<StoredEvent[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value) {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as StoredEvent[];
    }
  } catch (error) {
    console.warn('Unable to read local events cache:', error);
  }

  const seeded = makeSeedEvents();
  await writeStoredEvents(seeded);
  return seeded;
}

async function writeStoredEvents(events: StoredEvent[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('Unable to write local events cache:', error);
  }
}

function toPublicEvent(event: StoredEvent, currentUserId: string): CampusEvent {
  return {
    ...event,
    userRsvp: event.rsvps[currentUserId] ?? null,
  };
}

export async function fetchEvents(category: EventCategory = 'All', currentUserId = DEFAULT_USER_ID): Promise<CampusEvent[]> {
  const events = await readStoredEvents();
  return events
    .filter((event) => category === 'All' || event.category === category)
    .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime())
    .map((event) => toPublicEvent(event, currentUserId));
}

export async function fetchEventById(eventId: string, currentUserId = DEFAULT_USER_ID): Promise<CampusEvent | null> {
  const events = await readStoredEvents();
  const event = events.find((item) => item.id === eventId);
  return event ? toPublicEvent(event, currentUserId) : null;
}

export async function createEvent(eventData: CreateEventData, coverImageUri: string | undefined, host: EventPerson): Promise<CampusEvent> {
  const events = await readStoredEvents();
  const record: StoredEvent = {
    ...eventData,
    id: `local-event-${Date.now()}`,
    coverUrl: coverImageUri,
    goingCount: 0,
    interestedCount: 0,
    createdAt: new Date().toISOString(),
    host,
    attendees: [],
    rsvps: {},
  };
  const updated = [record, ...events];
  await writeStoredEvents(updated);
  return toPublicEvent(record, host.id);
}

export async function updateEvent(
  eventId: string,
  eventData: CreateEventData,
  coverImageUri: string | undefined,
  clearCover = false,
  currentUserId?: string,
): Promise<CampusEvent | null> {
  const events = await readStoredEvents();
  const event = events.find((item) => item.id === eventId);
  if (!event) return null;
  if (currentUserId && event.host.id !== currentUserId) throw new Error('Only the event host can edit this event.');

  Object.assign(event, eventData);
  if (coverImageUri) event.coverUrl = coverImageUri;
  else if (clearCover) delete event.coverUrl;
  await writeStoredEvents(events);
  return toPublicEvent(event, event.host.id);
}

export async function deleteEvent(eventId: string, currentUserId?: string): Promise<void> {
  const events = await readStoredEvents();
  const event = events.find((item) => item.id === eventId);
  if (event && currentUserId && event.host.id !== currentUserId) throw new Error('Only the event host can delete this event.');
  await writeStoredEvents(events.filter((event) => event.id !== eventId));
  const discussions = await readStoredDiscussions();
  delete discussions[eventId];
  await writeStoredDiscussions(discussions);
}

export async function setEventRSVP(
  eventId: string,
  userId: string,
  status: EventRsvpSelection,
): Promise<CampusEvent | null> {
  const events = await readStoredEvents();
  const event = events.find((item) => item.id === eventId);
  if (!event) return null;

  const previous = event.rsvps[userId];
  if (previous) {
    if (previous === 'going') event.goingCount = Math.max(0, event.goingCount - 1);
    if (previous === 'interested') event.interestedCount = Math.max(0, event.interestedCount - 1);
    delete event.rsvps[userId];
  }

  if (status !== 'none') {
    event.rsvps[userId] = status;
    if (status === 'going') event.goingCount += 1;
    if (status === 'interested') event.interestedCount += 1;
  }

  if (status === 'going' && !event.attendees.some((person) => person.id === userId)) {
    event.attendees = [
      { id: userId, username: 'you', name: 'You' },
      ...event.attendees,
    ];
  } else if (previous === 'going' && status !== 'going') {
    event.attendees = event.attendees.filter((person) => person.id !== userId);
  }

  await writeStoredEvents(events);
  return toPublicEvent(event, userId);
}

export async function getEventAttendees(eventId: string): Promise<EventPerson[]> {
  const events = await readStoredEvents();
  return events.find((event) => event.id === eventId)?.attendees ?? [];
}

export type EventComment = {
  id: string;
  eventId: string;
  author: EventPerson;
  message: string;
  createdAt: string;
  isPinned?: boolean;
};

type StoredDiscussions = Record<string, EventComment[]>;

const makeSeedDiscussions = (): StoredDiscussions => ({
  'local-event-1': [
    {
      id: 'local-comment-1',
      eventId: 'local-event-1',
      author: samplePeople[0],
      message: 'Blankets and popcorn are covered. Bring a friend and come early for the sunset!',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      isPinned: true,
    },
    {
      id: 'local-comment-2',
      eventId: 'local-event-1',
      author: samplePeople[1],
      message: 'Is there bike parking nearby?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ],
});

async function readStoredDiscussions(): Promise<StoredDiscussions> {
  try {
    const value = await AsyncStorage.getItem(DISCUSSION_KEY);
    if (value) {
      const parsed: unknown = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as StoredDiscussions;
    }
  } catch (error) {
    console.warn('Unable to read local event discussion:', error);
  }

  const seeded = makeSeedDiscussions();
  await writeStoredDiscussions(seeded);
  return seeded;
}

async function writeStoredDiscussions(discussions: StoredDiscussions) {
  try {
    await AsyncStorage.setItem(DISCUSSION_KEY, JSON.stringify(discussions));
  } catch (error) {
    console.warn('Unable to save local event discussion:', error);
  }
}

export async function fetchEventDiscussion(eventId: string): Promise<EventComment[]> {
  const discussions = await readStoredDiscussions();
  return [...(discussions[eventId] ?? [])].sort((first, second) => {
    if (first.isPinned && !second.isPinned) return -1;
    if (!first.isPinned && second.isPinned) return 1;
    return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
  });
}

export async function addEventComment(eventId: string, author: EventPerson, message: string): Promise<EventComment[]> {
  const discussions = await readStoredDiscussions();
  const comment: EventComment = {
    id: `local-comment-${Date.now()}`,
    eventId,
    author,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };
  discussions[eventId] = [...(discussions[eventId] ?? []), comment];
  await writeStoredDiscussions(discussions);
  return fetchEventDiscussion(eventId);
}
