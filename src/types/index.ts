export type ReportType = 'lost' | 'found';

export type ReportStatus = 'pending' | 'processing' | 'matched' | 'contacted' | 'closed';

export type ItemCategory =
  | 'electronics'
  | 'documents'
  | 'jewelry'
  | 'bags'
  | 'keys'
  | 'pets'
  | 'clothing'
  | 'other';

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

export interface Report {
  id: string;
  user_id: string;
  type: ReportType;
  title: string;
  description: string;
  category: ItemCategory;
  color?: string;
  distinguishing_marks?: string;
  date_occurred: string;
  location_address?: string;
  location_city?: string;
  location_lat?: number;
  location_lng?: number;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  images?: string[];
  image_descriptions?: string[];
  user_name?: string;
  user_email?: string;
}

export interface AIMatch {
  id: string;
  lostReportId: string;
  foundReportId: string;
  imageScore: number;
  textScore: number;
  locationScore: number;
  finalScore: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  is_active: boolean;
  is_suspended: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'status' | 'admin' | 'system';
  read: boolean;
  createdAt: string;
}

export interface Stats {
  totalLostReports: number;
  totalFoundReports: number;
  successfulMatches: number;
  pendingReports: number;
  matchRate: number;
}
