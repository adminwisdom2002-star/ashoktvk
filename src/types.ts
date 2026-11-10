export type PetitionStatus = 'pending' | 'in_progress' | 'action_taken' | 'resolved';

export const ISSUE_CATEGORIES = [
  { value: 'water', label: 'குடிநீர் விநியோகம் / தட்டுப்பாடு', shortLabel: 'குடிநீர்' },
  { value: 'road', label: 'சாலை / தெருப் பராமரிப்பு', shortLabel: 'சாலைகள்' },
  { value: 'light', label: 'தெருவிளக்கு பழுது', shortLabel: 'தெருவிளக்கு' },
  { value: 'drainage', label: 'கழிவுநீர் / வடிகால் பிரச்சினை', shortLabel: 'வடிகால்' },
  { value: 'sanitation', label: 'குப்பை / தூய்மைப் பணி', shortLabel: 'தூய்மை' },
  { value: 'electricity', label: 'மின்சார விநியோகம்', shortLabel: 'மின்சாரம்' },
  { value: 'health', label: 'பொது சுகாதாரம் / மருத்துவ வசதி', shortLabel: 'சுகாதாரம்' },
  { value: 'education', label: 'பள்ளி / கல்வி வசதிகள்', shortLabel: 'கல்வி' },
  { value: 'transport', label: 'பேருந்து / பொதுப் போக்குவரத்து', shortLabel: 'போக்குவரத்து' },
  { value: 'ration', label: 'ரேஷன் / பொது விநியோகத் திட்டம்', shortLabel: 'ரேஷன்' },
  { value: 'land', label: 'பட்டா / நில ஆவணங்கள்', shortLabel: 'நில ஆவணங்கள்' },
  { value: 'welfare', label: 'அரசு நலத்திட்டங்கள் / ஓய்வூதியம்', shortLabel: 'நலத்திட்டங்கள்' },
  { value: 'public_safety', label: 'பொது பாதுகாப்பு', shortLabel: 'பாதுகாப்பு' },
  { value: 'public_facilities', label: 'பொது வசதிகள் / பூங்கா', shortLabel: 'பொது வசதிகள்' },
  { value: 'environment', label: 'சுற்றுச்சூழல் / மாசு', shortLabel: 'சுற்றுச்சூழல்' },
  { value: 'others', label: 'இதர புகார்கள் / கோரிக்கைகள்', shortLabel: 'இதர புகார்கள்' }
] as const;

export type IssueCategory = typeof ISSUE_CATEGORIES[number]['value'];

export const getIssueCategoryLabel = (category: string): string =>
  ISSUE_CATEGORIES.find(item => item.value === category)?.label ?? 'இதர புகார்கள் / கோரிக்கைகள்';

export const getIssueCategoryShortLabel = (category: string): string =>
  ISSUE_CATEGORIES.find(item => item.value === category)?.shortLabel ?? 'இதர புகார்கள்';

export interface Comment {
  id: string;
  author: string;
  role: 'citizen' | 'volunteer' | 'admin';
  text: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  wardNo: number;
  avatarUrl: string;
}

export interface Petition {
  id: string;
  trackingNo: string; // e.g. MS-ACH-2026-1001
  title: string;
  description: string;
  formalDraft?: string;
  category: IssueCategory;
  wardNo: number;
  streetName: string;
  citizenName: string;
  avatarUrl?: string;
  phone: string;
  status: PetitionStatus;
  upvotes: number;
  upvotedBySession?: boolean;
  imageUrl?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  officialNote?: string;
}

export interface WardInfo {
  wardNo: number;
  name: string;
  keyStreets: string[];
  inchargeName: string;
  inchargePhone: string;
  totalIssues: number;
  resolvedIssues: number;
}

export interface Helpline {
  id: string;
  department: string;
  phone: string;
  altPhone?: string;
  timing: string;
  iconName: string;
  address?: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  badge: string;
  isImportant?: boolean;
}

export type EventCategory = 'ward_meeting' | 'sanitation_drive' | 'outreach_program' | 'water_inspection' | 'health_camp' | 'grievance_camp';

export interface CivicEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  wardNo: number; // 0 for all wards
  organizer: string;
  organizerPhone: string;
  description: string;
  attendeesCount: number;
  userRsvp?: boolean;
  badge: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}
