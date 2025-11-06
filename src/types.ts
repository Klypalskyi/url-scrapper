export interface WebsiteInfo {
  name: string | null;
  description: string | null;
  website: string;
  contact: {
    email: string | null;
    phone: string | null;
  };
  socialMedia: {
    linkedin: string | null;
    twitter: string | null;
    facebook: string | null;
    instagram: string | null;
    youtube: string | null;
  };
  registrationNumber: string | null;
  extractedAt: string;
}

export interface ApiResponse {
  success: boolean;
  data?: WebsiteInfo;
  error?: string;
  cached?: boolean;
}

export interface CacheEntry {
  data: WebsiteInfo;
  timestamp: number;
}
